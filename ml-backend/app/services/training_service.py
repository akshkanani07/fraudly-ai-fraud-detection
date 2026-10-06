import logging
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from app.core.config import Settings
from app.core.errors import AppError, InvalidRequestError, ModelNotFoundError
from app.ml.preprocessing.cleaner import clean_dataset, load_dataframe
from app.ml.preprocessing.features import build_feature_schema
from app.ml.training.trainer import train_models
from app.schemas.common import JobStatus, utc_now
from app.schemas.models import ModelSummary
from app.schemas.training import (
    AlgorithmResult,
    ModelMetrics,
    TrainingConfig,
    TrainingJob,
    TrainingResult,
)
from app.services.model_registry import ModelRegistry

logger = logging.getLogger(__name__)

MAX_JOBS_KEPT = 50

_METRIC_FIELDS = {
    "f1": "f1_score",
    "roc_auc": "roc_auc",
    "pr_auc": "pr_auc",
    "recall": "recall",
    "precision": "precision",
}


def _score(metrics: ModelMetrics, selection_metric: str) -> float:
    return float(getattr(metrics, _METRIC_FIELDS[selection_metric]))


class TrainingService:
    """Runs training jobs one at a time on a background thread."""

    def __init__(self, settings: Settings, registry: ModelRegistry) -> None:
        self._settings = settings
        self._registry = registry
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="training")
        self._jobs: dict[str, TrainingJob] = {}
        self._lock = threading.Lock()

    @staticmethod
    def new_job_id() -> str:
        return f"job_{uuid.uuid4().hex[:12]}"

    def get(self, job_id: str) -> TrainingJob:
        with self._lock:
            job = self._jobs.get(job_id)
        if job is None:
            raise ModelNotFoundError("Training job not found")
        return job

    def submit(self, job_id: str, dataset_path: Path, config: TrainingConfig) -> TrainingJob:
        job = self._create_job(job_id)
        self._executor.submit(self._execute, job_id, dataset_path, config)
        return job

    def run_blocking(self, job_id: str, dataset_path: Path, config: TrainingConfig) -> TrainingJob:
        """Runs a job on the calling thread (used by tests)."""
        self._create_job(job_id)
        self._execute(job_id, dataset_path, config)
        return self.get(job_id)

    def submit_retrain(self, model_id: str) -> TrainingJob:
        extra = self._registry.get_extra(model_id)
        config = TrainingConfig.model_validate(extra["config"])
        dataset_path = self._settings.datasets_dir / Path(str(extra.get("datasetFile", ""))).name

        if not dataset_path.is_file():
            raise InvalidRequestError(
                "The dataset used for this model is no longer available. Train again with a new upload."
            )

        return self.submit(self.new_job_id(), dataset_path, config)

    def shutdown(self) -> None:
        self._executor.shutdown(wait=False, cancel_futures=True)

    def _create_job(self, job_id: str) -> TrainingJob:
        job = TrainingJob(job_id=job_id, status=JobStatus.QUEUED, progress=0, stage="Queued")
        with self._lock:
            self._jobs[job_id] = job
            finished = [j for j in self._jobs.values() if j.status in (JobStatus.COMPLETED, JobStatus.FAILED)]
            for old in sorted(finished, key=lambda j: j.created_at)[: max(0, len(self._jobs) - MAX_JOBS_KEPT)]:
                self._jobs.pop(old.job_id, None)
        return job

    def _update(self, job_id: str, **changes: Any) -> None:
        with self._lock:
            self._jobs[job_id] = self._jobs[job_id].model_copy(update=changes)

    def _execute(self, job_id: str, dataset_path: Path, config: TrainingConfig) -> None:
        self._update(job_id, status=JobStatus.RUNNING, started_at=utc_now(), progress=5, stage="Loading dataset")
        try:
            result = self._train(job_id, dataset_path, config)
            self._update(
                job_id, status=JobStatus.COMPLETED, progress=100, stage="Completed",
                finished_at=utc_now(), result=result,
            )
        except AppError as error:
            logger.warning("Training failed", extra={"job_id": job_id, "reason": error.message})
            self._update(job_id, status=JobStatus.FAILED, stage="Failed", error=error.message, finished_at=utc_now())
        except Exception:
            logger.exception("Training crashed", extra={"job_id": job_id})
            self._update(
                job_id, status=JobStatus.FAILED, stage="Failed", finished_at=utc_now(),
                error="Training failed unexpectedly. Check the ML service logs.",
            )

    def _train(self, job_id: str, dataset_path: Path, config: TrainingConfig) -> TrainingResult:
        started = utc_now()

        frame = load_dataframe(dataset_path)
        self._update(job_id, progress=10, stage="Cleaning data")
        X, y, cleaning, profile = clean_dataset(
            frame,
            target_column=config.target_column,
            positive_label=config.positive_label,
            drop_columns=config.drop_columns,
            feature_columns=config.feature_columns,
        )
        schema = build_feature_schema(X)

        trained = train_models(
            X, y, config,
            default_test_size=self._settings.test_size,
            default_random_state=self._settings.random_state,
            progress=lambda percent, stage: self._update(job_id, progress=percent, stage=stage),
        )

        best = max(trained, key=lambda model: _score(model.metrics, config.selection_metric))
        self._update(job_id, progress=92, stage="Saving models")

        results: list[AlgorithmResult] = []
        best_model_id = ""

        for model in trained:
            model_id = f"mdl_{uuid.uuid4().hex[:12]}"
            is_best = model is best
            best_model_id = model_id if is_best else best_model_id

            summary = self._registry.save(
                summary=ModelSummary(
                    model_id=model_id,
                    run_id=job_id,
                    name=config.model_name,
                    algorithm=model.algorithm,
                    target_column=config.target_column,
                    feature_columns=[str(column) for column in X.columns],
                    feature_schema=schema,
                    metrics=model.metrics,
                    feature_importance=model.feature_importance,
                    hyperparameters=model.hyperparameters,
                    training_rows=len(X),
                    training_seconds=model.training_seconds,
                    selection_metric=config.selection_metric,
                    is_best_in_run=is_best,
                    trained_at=utc_now(),
                    has_dataset=True,
                ),
                pipeline=model.pipeline,
                extra={
                    "config": config.model_dump(mode="json", by_alias=True),
                    "datasetFile": dataset_path.name,
                    "cleaning": cleaning.model_dump(mode="json", by_alias=True),
                },
            )

            results.append(
                AlgorithmResult(
                    model_id=model_id,
                    algorithm=model.algorithm,
                    metrics=model.metrics,
                    feature_importance=model.feature_importance,
                    hyperparameters=model.hyperparameters,
                    training_seconds=model.training_seconds,
                    artifact_size_bytes=summary.artifact_size_bytes,
                    is_best=is_best,
                )
            )

        return TrainingResult(
            name=config.model_name,
            target_column=config.target_column,
            feature_columns=[str(column) for column in X.columns],
            selection_metric=config.selection_metric,
            best_model_id=best_model_id,
            best_algorithm=best.algorithm,
            dataset_profile=profile,
            cleaning_summary=cleaning,
            results=results,
            total_training_seconds=round((utc_now() - started).total_seconds(), 2),
        )