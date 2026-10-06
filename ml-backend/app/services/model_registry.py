import json
import logging
import os
import re
import threading
from collections import OrderedDict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
from sklearn.pipeline import Pipeline

from app.core.errors import ModelNotFoundError
from app.schemas.models import ModelSummary

logger = logging.getLogger(__name__)

_MODEL_ID = re.compile(r"^[A-Za-z0-9_-]{1,100}$")


@dataclass
class LoadedModel:
    summary: ModelSummary
    pipeline: Pipeline
    explainer: Any | None = None
    explainer_ready: bool = False


class ModelRegistry:
    """File based model store: <id>.joblib (pipeline) + <id>.json (metadata)."""

    def __init__(self, models_dir: Path, cache_size: int = 4) -> None:
        self._dir = models_dir
        self._cache_size = cache_size
        self._cache: OrderedDict[str, LoadedModel] = OrderedDict()
        self._lock = threading.Lock()
        self._dir.mkdir(parents=True, exist_ok=True)

    def _paths(self, model_id: str) -> tuple[Path, Path]:
        if not _MODEL_ID.match(model_id):
            raise ModelNotFoundError("Model not found")
        return self._dir / f"{model_id}.joblib", self._dir / f"{model_id}.json"

    def save(self, *, summary: ModelSummary, pipeline: Pipeline, extra: dict[str, Any]) -> ModelSummary:
        artifact, metadata = self._paths(summary.model_id)

        temp_artifact = artifact.with_suffix(".joblib.tmp")
        joblib.dump(pipeline, temp_artifact, compress=3)
        os.replace(temp_artifact, artifact)

        summary = summary.model_copy(update={"artifact_size_bytes": artifact.stat().st_size})
        payload = {"summary": summary.model_dump(mode="json", by_alias=True), **extra}

        temp_metadata = metadata.with_suffix(".json.tmp")
        temp_metadata.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        os.replace(temp_metadata, metadata)

        return summary

    def _read_metadata(self, model_id: str) -> dict[str, Any]:
        _, metadata = self._paths(model_id)
        if not metadata.exists():
            raise ModelNotFoundError("Model not found")
        return json.loads(metadata.read_text(encoding="utf-8"))

    def get_summary(self, model_id: str) -> ModelSummary:
        return ModelSummary.model_validate(self._read_metadata(model_id)["summary"])

    def get_extra(self, model_id: str) -> dict[str, Any]:
        return self._read_metadata(model_id)

    def list_summaries(self) -> list[ModelSummary]:
        summaries: list[ModelSummary] = []

        for path in sorted(self._dir.glob("*.json")):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                summaries.append(ModelSummary.model_validate(data["summary"]))
            except Exception:
                logger.warning("Skipping unreadable model metadata", extra={"file": path.name})

        return sorted(summaries, key=lambda item: item.trained_at, reverse=True)

    def load(self, model_id: str) -> LoadedModel:
        with self._lock:
            cached = self._cache.get(model_id)
            if cached:
                self._cache.move_to_end(model_id)
                return cached

        artifact, _ = self._paths(model_id)
        if not artifact.exists():
            raise ModelNotFoundError("Model not found")

        loaded = LoadedModel(summary=self.get_summary(model_id), pipeline=joblib.load(artifact))

        with self._lock:
            self._cache[model_id] = loaded
            while len(self._cache) > self._cache_size:
                self._cache.popitem(last=False)

        return loaded

    def delete(self, model_id: str) -> None:
        artifact, metadata = self._paths(model_id)
        if not metadata.exists() and not artifact.exists():
            raise ModelNotFoundError("Model not found")

        artifact.unlink(missing_ok=True)
        metadata.unlink(missing_ok=True)

        with self._lock:
            self._cache.pop(model_id, None)