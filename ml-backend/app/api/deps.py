from functools import lru_cache

from app.core.config import get_settings
from app.services.model_registry import ModelRegistry
from app.services.prediction_service import PredictionService
from app.services.training_service import TrainingService


@lru_cache
def get_registry() -> ModelRegistry:
    return ModelRegistry(get_settings().models_dir)


@lru_cache
def get_training_service() -> TrainingService:
    return TrainingService(get_settings(), get_registry())


@lru_cache
def get_prediction_service() -> PredictionService:
    return PredictionService(get_registry())