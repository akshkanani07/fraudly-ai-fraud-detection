from datetime import datetime
from typing import Any, Literal

from pydantic import Field

from app.schemas.common import Algorithm, APIModel
from app.schemas.training import FeatureImportanceItem, ModelMetrics


class FeatureSchemaItem(APIModel):
    name: str
    kind: Literal["numeric", "categorical"]
    min: float | None = None
    max: float | None = None
    mean: float | None = None
    example: str | float | None = None
    categories: list[str] = Field(default_factory=list)
    missing_percentage: float = Field(default=0.0, ge=0.0, le=100.0)


class ModelSummary(APIModel):
    model_id: str
    run_id: str
    name: str
    algorithm: Algorithm
    target_column: str
    feature_columns: list[str]
    feature_schema: list[FeatureSchemaItem]
    metrics: ModelMetrics
    feature_importance: list[FeatureImportanceItem] = Field(default_factory=list)
    hyperparameters: dict[str, Any] = Field(default_factory=dict)
    training_rows: int = Field(ge=0)
    training_seconds: float = Field(ge=0.0)
    artifact_size_bytes: int = Field(default=0, ge=0)
    selection_metric: str
    is_best_in_run: bool = False
    trained_at: datetime
    has_dataset: bool = True


class ModelListResponse(APIModel):
    models: list[ModelSummary]