from datetime import datetime
from typing import Any, Literal

from pydantic import Field, model_validator

from app.schemas.common import (
    Algorithm,
    APIModel,
    JobStatus,
    Probability,
    utc_now,
)

SelectionMetric = Literal["f1", "roc_auc", "pr_auc", "recall", "precision"]


class TrainingConfig(APIModel):
    """Options for a training run. The dataset file is sent alongside this config."""

    model_name: str = Field(min_length=2, max_length=80)
    target_column: str = Field(min_length=1, max_length=200)

    # Which value of the target column means "fraud" (e.g. 1, "fraud", "Yes").
    # When omitted it is inferred (1 / true / fraud / yes ...).
    positive_label: str | int | bool | None = None

    algorithms: list[Algorithm] = Field(
        default_factory=lambda: list(Algorithm),
        min_length=1,
        max_length=3,
    )

    # None means "use every column except the target and dropped columns".
    feature_columns: list[str] | None = None
    drop_columns: list[str] = Field(default_factory=list)

    test_size: float | None = Field(default=None, gt=0.0, lt=0.5)
    selection_metric: SelectionMetric = "pr_auc"
    handle_imbalance: bool = True
    optimize_threshold: bool = True

    # Optional hyperparameter overrides per algorithm, e.g.
    # {"RANDOM_FOREST": {"n_estimators": 400}}
    hyperparameters: dict[Algorithm, dict[str, Any]] = Field(default_factory=dict)
    random_state: int | None = None

    @model_validator(mode="after")
    def validate_columns(self) -> "TrainingConfig":
        if len(set(self.algorithms)) != len(self.algorithms):
            raise ValueError("algorithms must not contain duplicates")

        if self.target_column in self.drop_columns:
            raise ValueError("target_column cannot be listed in drop_columns")

        if self.feature_columns is not None:
            if not self.feature_columns:
                raise ValueError("feature_columns must not be empty when provided")
            if self.target_column in self.feature_columns:
                raise ValueError("target_column cannot be listed in feature_columns")
            overlap = set(self.feature_columns) & set(self.drop_columns)
            if overlap:
                raise ValueError(
                    f"columns cannot be both features and dropped: {sorted(overlap)}"
                )

        return self


class ColumnProfile(APIModel):
    name: str
    dtype: str
    is_numeric: bool
    missing_count: int = Field(ge=0)
    missing_percentage: float = Field(ge=0.0, le=100.0)
    unique_count: int = Field(ge=0)


class DatasetProfile(APIModel):
    row_count: int = Field(ge=0)
    column_count: int = Field(ge=0)
    duplicate_rows: int = Field(ge=0)
    fraud_count: int = Field(ge=0)
    legitimate_count: int = Field(ge=0)
    fraud_rate: Probability
    columns: list[ColumnProfile]


class CleaningSummary(APIModel):
    original_rows: int = Field(ge=0)
    final_rows: int = Field(ge=0)
    duplicate_rows_removed: int = Field(default=0, ge=0)
    rows_dropped_missing_target: int = Field(default=0, ge=0)
    constant_columns_dropped: list[str] = Field(default_factory=list)
    high_missing_columns_dropped: list[str] = Field(default_factory=list)
    id_like_columns_dropped: list[str] = Field(default_factory=list)
    missing_values_imputed: int = Field(default=0, ge=0)


class ConfusionMatrix(APIModel):
    true_negative: int = Field(ge=0)
    false_positive: int = Field(ge=0)
    false_negative: int = Field(ge=0)
    true_positive: int = Field(ge=0)


class ModelMetrics(APIModel):
    accuracy: Probability
    precision: Probability
    recall: Probability
    f1_score: Probability
    specificity: Probability
    roc_auc: Probability
    pr_auc: Probability
    threshold: Probability
    test_samples: int = Field(ge=1)
    confusion_matrix: ConfusionMatrix


class FeatureImportanceItem(APIModel):
    feature: str
    importance: float = Field(ge=0.0)


class AlgorithmResult(APIModel):
    model_id: str
    algorithm: Algorithm
    metrics: ModelMetrics
    feature_importance: list[FeatureImportanceItem] = Field(default_factory=list)
    hyperparameters: dict[str, Any] = Field(default_factory=dict)
    training_seconds: float = Field(ge=0.0)
    artifact_size_bytes: int = Field(default=0, ge=0)
    is_best: bool = False


class TrainingResult(APIModel):
    name: str
    target_column: str
    feature_columns: list[str]
    selection_metric: SelectionMetric
    best_model_id: str
    best_algorithm: Algorithm
    dataset_profile: DatasetProfile
    cleaning_summary: CleaningSummary
    results: list[AlgorithmResult]
    total_training_seconds: float = Field(ge=0.0)
    trained_at: datetime = Field(default_factory=utc_now)


class TrainingJobAccepted(APIModel):
    job_id: str
    status: JobStatus = JobStatus.QUEUED


class TrainingJob(APIModel):
    job_id: str
    status: JobStatus
    progress: int = Field(default=0, ge=0, le=100)
    stage: str | None = None
    error: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    started_at: datetime | None = None
    finished_at: datetime | None = None
    result: TrainingResult | None = None