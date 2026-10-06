import time

from app.ml.prediction.predictor import predict_records
from app.schemas.prediction import (
    BatchPredictionRequest,
    BatchPredictionResponse,
    PredictionRecord,
    PredictionRequest,
    PredictionResponse,
)
from app.services.model_registry import ModelRegistry


class PredictionService:
    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        loaded = self._registry.load(request.model_id)
        record = PredictionRecord(transaction_id=request.transaction_id, features=request.features)
        return predict_records(
            loaded, [record],
            threshold=request.threshold, explain=request.explain, top_factors=request.top_factors,
        )[0]

    def predict_batch(self, request: BatchPredictionRequest) -> BatchPredictionResponse:
        started = time.perf_counter()
        loaded = self._registry.load(request.model_id)
        predictions = predict_records(
            loaded, request.records,
            threshold=request.threshold, explain=request.explain, top_factors=request.top_factors,
        )
        return BatchPredictionResponse(
            model_id=request.model_id,
            count=len(predictions),
            fraud_count=sum(1 for item in predictions if item.is_fraud),
            predictions=predictions,
            latency_ms=round((time.perf_counter() - started) * 1000, 2),
        )