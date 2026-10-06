import time

import numpy as np
import pandas as pd

from app.ml.explainability.explainer import build_explainer, explain_frame
from app.schemas.common import RiskLevel
from app.schemas.prediction import FraudFactor, PredictionRecord, PredictionResponse
from app.services.model_registry import LoadedModel


def risk_level(probability: float, threshold: float) -> RiskLevel:
    critical_cut = threshold + (1.0 - threshold) * 0.6
    if probability >= critical_cut:
        return RiskLevel.CRITICAL
    if probability >= threshold:
        return RiskLevel.HIGH
    if probability >= threshold * 0.5:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def _build_frame(loaded: LoadedModel, records: list[PredictionRecord]) -> tuple[pd.DataFrame, list[list[str]]]:
    columns = loaded.summary.feature_columns
    kinds = {item.name: item.kind for item in loaded.summary.feature_schema}

    frame = pd.DataFrame(
        [{column: record.features.get(column) for column in columns} for record in records],
        columns=columns,
    )
    for column in columns:
        if kinds.get(column) == "numeric":
            frame[column] = pd.to_numeric(frame[column], errors="coerce")

    missing = [[c for c in columns if record.features.get(c) is None] for record in records]
    return frame, missing


def predict_records(
    loaded: LoadedModel,
    records: list[PredictionRecord],
    *,
    threshold: float | None,
    explain: bool,
    top_factors: int,
) -> list[PredictionResponse]:
    started = time.perf_counter()
    effective = threshold if threshold is not None else loaded.summary.metrics.threshold

    frame, missing = _build_frame(loaded, records)
    probabilities = np.clip(loaded.pipeline.predict_proba(frame)[:, 1], 0.0, 1.0)

    factors: list[list[FraudFactor]] = [[] for _ in records]
    if explain:
        if not loaded.explainer_ready:
            loaded.explainer = build_explainer(loaded.pipeline, loaded.summary.algorithm)
            loaded.explainer_ready = True
        factors = explain_frame(loaded.pipeline, loaded.summary.algorithm, loaded.explainer, frame, top_factors)

    latency_ms = (time.perf_counter() - started) * 1000 / len(records)

    return [
        PredictionResponse(
            transaction_id=record.transaction_id,
            model_id=loaded.summary.model_id,
            is_fraud=bool(probability >= effective),
            fraud_probability=float(probability),
            confidence=float(max(probability, 1.0 - probability)),
            risk_level=risk_level(float(probability), effective),
            threshold=float(effective),
            factors=factors[index],
            missing_features=missing[index],
            latency_ms=round(latency_ms, 2),
        )
        for index, (record, probability) in enumerate(zip(records, probabilities, strict=True))
    ]