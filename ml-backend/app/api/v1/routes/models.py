from fastapi import APIRouter, Depends, status

from app.api.deps import get_registry, get_training_service
from app.schemas.common import MessageResponse
from app.schemas.models import ModelListResponse, ModelSummary
from app.schemas.training import TrainingJobAccepted
from app.services.model_registry import ModelRegistry
from app.services.training_service import TrainingService

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=ModelListResponse)
def list_models(registry: ModelRegistry = Depends(get_registry)) -> ModelListResponse:
    return ModelListResponse(models=registry.list_summaries())


@router.get("/{model_id}", response_model=ModelSummary)
def get_model(model_id: str, registry: ModelRegistry = Depends(get_registry)) -> ModelSummary:
    return registry.get_summary(model_id)


@router.delete("/{model_id}", response_model=MessageResponse)
def delete_model(model_id: str, registry: ModelRegistry = Depends(get_registry)) -> MessageResponse:
    registry.delete(model_id)
    return MessageResponse(message="Model deleted")


@router.post("/{model_id}/retrain", response_model=TrainingJobAccepted, status_code=status.HTTP_202_ACCEPTED)
def retrain_model(model_id: str, service: TrainingService = Depends(get_training_service)) -> TrainingJobAccepted:
    job = service.submit_retrain(model_id)
    return TrainingJobAccepted(job_id=job.job_id)