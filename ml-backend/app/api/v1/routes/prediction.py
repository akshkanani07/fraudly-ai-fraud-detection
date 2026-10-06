from fastapi import APIRouter, Depends

from app.api.deps import get_prediction_service
from app.schemas.prediction import (
    BatchPredictionRequest,
    BatchPredictionResponse,
    PredictionRequest,
    PredictionResponse,
)
from app.services.prediction_service import PredictionService

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("", response_model=PredictionResponse)
def predict(
    request: PredictionRequest, service: PredictionService = Depends(get_prediction_service)
) -> PredictionResponse:
    return service.predict(request)


@router.post("/batch", response_model=BatchPredictionResponse)
def predict_batch(
    request: BatchPredictionRequest, service: PredictionService = Depends(get_prediction_service)
) -> BatchPredictionResponse:
    return service.predict_batch(request)