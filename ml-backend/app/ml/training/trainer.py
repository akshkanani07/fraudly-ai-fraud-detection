import logging
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

from app.core.errors import InvalidRequestError
from app.ml.evaluation.metrics import compute_metrics, find_best_threshold
from app.ml.preprocessing.features import aggregate_by_column, build_pipeline, categorical_columns_of
from app.schemas.common import Algorithm
from app.schemas.training import FeatureImportanceItem, ModelMetrics, TrainingConfig

logger = logging.getLogger(__name__)

ProgressCallback = Callable[[int, str], None]

TOP_IMPORTANCE = 25
VALIDATION_SIZE = 0.15
DEFAULT_THRESHOLD = 0.5

ALGORITHM_LABELS = {
    Algorithm.LOGISTIC_REGRESSION: "Logistic Regression",
    Algorithm.RANDOM_FOREST: "Random Forest",
    Algorithm.XGBOOST: "XGBoost",
}

_REPORTED_PARAMS = {
    Algorithm.LOGISTIC_REGRESSION: ("C", "max_iter", "solver", "class_weight"),
    Algorithm.RANDOM_FOREST: ("n_estimators", "max_depth", "min_samples_leaf", "max_features", "class_weight"),
    Algorithm.XGBOOST: (
        "n_estimators", "learning_rate", "max_depth", "subsample",
        "colsample_bytree", "min_child_weight", "reg_lambda", "scale_pos_weight",
    ),
}


@dataclass(slots=True)
class TrainedModel:
    algorithm: Algorithm
    pipeline: Pipeline
    metrics: ModelMetrics
    feature_importance: list[FeatureImportanceItem]
    hyperparameters: dict[str, Any]
    training_seconds: float


def _build_estimator(algorithm: Algorithm, config: TrainingConfig, scale_pos_weight: float, random_state: int):
    balance = config.handle_imbalance

    if algorithm == Algorithm.LOGISTIC_REGRESSION:
        estimator = LogisticRegression(
            C=1.0,
            max_iter=2000,
            solver="lbfgs",
            class_weight="balanced" if balance else None,
            random_state=random_state,
        )
    elif algorithm == Algorithm.RANDOM_FOREST:
        estimator = RandomForestClassifier(
            n_estimators=300,
            min_samples_leaf=2,
            max_features="sqrt",
            class_weight="balanced_subsample" if balance else None,
            n_jobs=-1,
            random_state=random_state,
        )
    else:
        estimator = XGBClassifier(
            n_estimators=400,
            learning_rate=0.08,
            max_depth=6,
            subsample=0.9,
            colsample_bytree=0.9,
            min_child_weight=1,
            reg_lambda=1.0,
            scale_pos_weight=scale_pos_weight,
            eval_metric="aucpr",
            tree_method="hist",
            n_jobs=-1,
            random_state=random_state,
            verbosity=0,
        )

    overrides = config.hyperparameters.get(algorithm, {})
    if overrides:
        unknown = sorted(set(overrides) - set(estimator.get_params()))
        if unknown:
            raise InvalidRequestError(
                f"Unsupported hyperparameters for {algorithm.value}: {', '.join(unknown)}"
            )
        estimator.set_params(**overrides)

    return estimator


def _report_params(algorithm: Algorithm, estimator) -> dict[str, Any]:
    params = estimator.get_params()
    reported: dict[str, Any] = {}

    for key in _REPORTED_PARAMS[algorithm]:
        value = params.get(key)
        if isinstance(value, np.generic):
            value = value.item()
        reported[key] = value if value is None or isinstance(value, (str, int, float, bool)) else str(value)

    return reported


def _feature_importance(pipeline: Pipeline) -> list[FeatureImportanceItem]:
    preprocess = pipeline.named_steps["preprocess"]
    model = pipeline.named_steps["model"]

    if hasattr(model, "feature_importances_"):
        values = np.asarray(model.feature_importances_, dtype=float)
    elif hasattr(model, "coef_"):
        values = np.abs(np.asarray(model.coef_, dtype=float)).ravel()
    else:
        return []

    totals = aggregate_by_column(
        preprocess.get_feature_names_out(), values, categorical_columns_of(preprocess)
    )
    grand_total = sum(totals.values()) or 1.0
    ranked = sorted(totals.items(), key=lambda item: item[1], reverse=True)[:TOP_IMPORTANCE]

    return [
        FeatureImportanceItem(feature=name, importance=round(value / grand_total, 6))
        for name, value in ranked
    ]


def train_models(
    X: pd.DataFrame,
    y: pd.Series,
    config: TrainingConfig,
    *,
    default_test_size: float,
    default_random_state: int,
    progress: ProgressCallback,
) -> list[TrainedModel]:
    random_state = config.random_state if config.random_state is not None else default_random_state
    test_size = config.test_size or default_test_size

    progress(15, "Splitting data")
    X_train_full, X_test, y_train_full, y_test = train_test_split(
        X, y, test_size=test_size, stratify=y, random_state=random_state
    )

    if config.optimize_threshold:
        X_train, X_val, y_train, y_val = train_test_split(
            X_train_full, y_train_full, test_size=VALIDATION_SIZE, stratify=y_train_full, random_state=random_state
        )
    else:
        X_train, y_train, X_val, y_val = X_train_full, y_train_full, None, None

    positives = int(y_train.sum())
    negatives = int(len(y_train) - positives)
    scale_pos_weight = negatives / max(positives, 1) if config.handle_imbalance else 1.0

    trained: list[TrainedModel] = []
    step = 70 / len(config.algorithms)

    for index, algorithm in enumerate(config.algorithms):
        label = ALGORITHM_LABELS[algorithm]
        progress(int(20 + index * step), f"Training {label}")

        estimator = _build_estimator(algorithm, config, scale_pos_weight, random_state)
        pipeline = build_pipeline(algorithm, estimator)

        started = time.perf_counter()
        pipeline.fit(X_train, y_train)

        threshold = DEFAULT_THRESHOLD
        if X_val is not None and y_val is not None:
            threshold = find_best_threshold(y_val, pipeline.predict_proba(X_val)[:, 1], DEFAULT_THRESHOLD)

        progress(int(20 + (index + 0.8) * step), f"Evaluating {label}")
        metrics = compute_metrics(y_test, pipeline.predict_proba(X_test)[:, 1], threshold)
        elapsed = time.perf_counter() - started

        logger.info(
            "Model trained",
            extra={"algorithm": algorithm.value, "seconds": round(elapsed, 2), "f1": round(metrics.f1_score, 4)},
        )

        trained.append(
            TrainedModel(
                algorithm=algorithm,
                pipeline=pipeline,
                metrics=metrics,
                feature_importance=_feature_importance(pipeline),
                hyperparameters=_report_params(algorithm, estimator),
                training_seconds=round(elapsed, 2),
            )
        )

    return trained