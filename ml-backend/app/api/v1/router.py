from fastapi import APIRouter, Depends

from app.api.v1.routes import models, prediction, training
from app.core.security import verify_api_key

api_router = APIRouter(dependencies=[Depends(verify_api_key)])
api_router.include_router(training.router)
api_router.include_router(models.router)
api_router.include_router(prediction.router)