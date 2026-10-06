import logging
from typing import Any

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

from app.ml.preprocessing.features import aggregate_by_column, categorical_columns_of
from app.schemas.common import Algorithm
from app.schemas.prediction import FraudFactor

logger = logging.getLogger(__name__)


def build_explainer(pipeline: Pipeline, algorithm: Algorithm) -> Any | None:
    """TreeExplainer for tree models. Logistic regression is explained analytically."""
    if algorithm not in (Algorithm.RANDOM_FOREST, Algorithm.XGBOOST):
        return None
    try:
        import shap

        return shap.TreeExplainer(pipeline.named_steps["model"])
    except Exception:
        logger.warning("SHAP explainer could not be created", exc_info=True)
        return None


def _positive_class(values: Any) -> np.ndarray:
    if isinstance(values, list):
        values = values[-1]
    array = np.asarray(values, dtype=float)
    return array[:, :, -1] if array.ndim == 3 else array


def _python_value(value: Any) -> str | int | float | bool | None:
    if value is None:
        return None
    if isinstance(value, np.generic):
        value = value.item()
    if isinstance(value, float) and not np.isfinite(value):
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    return None if pd.isna(value) else str(value)


def _occlusion(pipeline: Pipeline, frame: pd.DataFrame) -> list[dict[str, float]]:
    """Model-agnostic fallback: how much does the risk drop when a feature is treated as missing?"""
    base = pipeline.predict_proba(frame)[:, 1]
    deltas: dict[str, np.ndarray] = {}

    for column in frame.columns:
        masked = frame.copy()
        masked[column] = np.nan
        deltas[str(column)] = base - pipeline.predict_proba(masked)[:, 1]

    return [{name: float(values[i]) for name, values in deltas.items()} for i in range(len(frame))]


def _to_factors(contributions: dict[str, float], values: pd.Series, top_n: int) -> list[FraudFactor]:
    ranked = sorted(contributions.items(), key=lambda item: abs(item[1]), reverse=True)[:top_n]
    factors: list[FraudFactor] = []

    for feature, contribution in ranked:
        if abs(contribution) < 1e-9:
            continue
        factors.append(
            FraudFactor(
                feature=feature,
                value=_python_value(values.get(feature) if feature in values.index else None),
                contribution=round(float(contribution), 4),
                direction="increases_risk" if contribution > 0 else "decreases_risk",
            )
        )

    return factors


def explain_frame(
    pipeline: Pipeline,
    algorithm: Algorithm,
    explainer: Any | None,
    frame: pd.DataFrame,
    top_n: int,
) -> list[list[FraudFactor]]:
    try:
        engineer = pipeline.named_steps["engineer"]
        preprocess = pipeline.named_steps["preprocess"]
        model = pipeline.named_steps["model"]

        engineered = engineer.transform(frame)
        matrix = np.asarray(preprocess.transform(engineered), dtype=float)

        if algorithm == Algorithm.LOGISTIC_REGRESSION:
            contributions = matrix * np.asarray(model.coef_, dtype=float).reshape(1, -1)
        elif explainer is not None:
            contributions = _positive_class(explainer.shap_values(matrix, check_additivity=False))
        else:
            raise RuntimeError("No explainer available")

        names = preprocess.get_feature_names_out()
        categorical = categorical_columns_of(preprocess)
        rows = [aggregate_by_column(names, row, categorical) for row in contributions]
        values_frame = engineered
    except Exception:
        logger.warning("Primary explanation failed, using occlusion fallback", exc_info=True)
        rows = _occlusion(pipeline, frame)
        values_frame = frame

    return [_to_factors(row, values_frame.iloc[index], top_n) for index, row in enumerate(rows)]