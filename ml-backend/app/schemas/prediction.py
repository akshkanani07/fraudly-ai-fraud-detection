from datetime import datetime
from typing import Literal

from pydantic import Field, field_validator

from app.schemas.common import APIModel, Probability, RiskLevel, utc_now

FeatureValue = str | int | float | bool | None

MAX_FEATURES_PER_RECORD = 500
MAX_BATCH_SIZE = 1000


def _validate_features(features: dict[str, FeatureValue]) -> dict[str, FeatureValue]:
    if not features:
        raise ValueError("features must contain at least one value")
    if len(features) > MAX_FEATURES_PER_RECORD:
        raise ValueError(f"features must contain at most {MAX_FEATURES_PER_RECORD} entries")
    if any(not key or len(key) > 200 for key in features):
        raise ValueError("feature names must be between 1 and 200 characters")
    return features


class PredictionRecord(APIModel):
    """A single transaction to score."""

    transaction_id: str | None = Field(default=None, max_length=100)
    features: dict[str, FeatureValue]

    @field_validator("features")
    @classmethod
    def check_features(cls, value: dict[str, FeatureValue]) -> dict[str, FeatureValue]:
        return _validate_features(value)


class PredictionRequest(PredictionRecord):
    model_id: str = Field(min_length=1, max_length=100)
    # Overrides the model's tuned decision threshold when provided.
    threshold: Probability | None = None
    explain: bool = True
    top_factors: int = Field(default=5, ge=1, le=15)


class BatchPredictionRequest(APIModel):
    model_id: str = Field(min_length=1, max_length=100)
    records: list[PredictionRecord] = Field(min_length=1, max_length=MAX_BATCH_SIZE)
    threshold: Probability | None = None
    explain: bool = False
    top_factors: int = Field(default=5, ge=1, le=15)


class FraudFactor(APIModel):
    """One feature's contribution to a prediction (Explainable AI)."""

    feature: str
    value: FeatureValue = None
    # Signed SHAP-style contribution on the model's output scale.
    contribution: float
    direction: Literal["increases_risk", "decreases_risk"]


class PredictionResponse(APIModel):
    transaction_id: str | None = None
    model_id: str
    is_fraud: bool
    fraud_probability: Probability
    # Confidence in the predicted class: max(p, 1 - p).
    confidence: Probability
    risk_level: RiskLevel
    threshold: Probability
    factors: list[FraudFactor] = Field(default_factory=list)
    # Features the model expects that were missing from the request (imputed).
    missing_features: list[str] = Field(default_factory=list)
    latency_ms: float = Field(ge=0.0)
    predicted_at: datetime = Field(default_factory=utc_now)


class BatchPredictionResponse(APIModel):
    model_id: str
    count: int = Field(ge=0)
    fraud_count: int = Field(ge=0)
    predictions: list[PredictionResponse]
    latency_ms: float = Field(ge=0.0)