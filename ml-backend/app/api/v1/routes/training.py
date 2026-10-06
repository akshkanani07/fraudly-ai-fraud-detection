from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from pydantic import ValidationError

from app.api.deps import get_training_service
from app.core.config import Settings, get_settings
from app.core.errors import InvalidRequestError, PayloadTooLargeError
from app.schemas.training import TrainingConfig, TrainingJob, TrainingJobAccepted
from app.services.training_service import TrainingService

router = APIRouter(prefix="/training", tags=["training"])

CHUNK_SIZE = 1024 * 1024


def _first_error(error: ValidationError) -> str:
    return "; ".join(f"{'.'.join(map(str, e['loc']))}: {e['msg']}" for e in error.errors()[:3])


@router.post("/jobs", response_model=TrainingJobAccepted, status_code=status.HTTP_202_ACCEPTED)
async def start_training(
    file: UploadFile = File(...),
    config: str = Form(...),
    service: TrainingService = Depends(get_training_service),
    settings: Settings = Depends(get_settings),
) -> TrainingJobAccepted:
    try:
        training_config = TrainingConfig.model_validate_json(config)
    except ValidationError as error:
        raise InvalidRequestError(_first_error(error)) from error

    if not (file.filename or "").lower().endswith(".csv"):
        raise InvalidRequestError("Only CSV files are supported.")

    job_id = service.new_job_id()
    path = settings.datasets_dir / f"{job_id}.csv"
    written = 0

    try:
        with path.open("wb") as buffer:
            while chunk := await file.read(CHUNK_SIZE):
                written += len(chunk)
                if written > settings.max_upload_size_bytes:
                    raise PayloadTooLargeError(f"The file exceeds the {settings.max_upload_size_mb} MB limit.")
                buffer.write(chunk)
    except Exception:
        path.unlink(missing_ok=True)
        raise

    if written == 0:
        path.unlink(missing_ok=True)
        raise InvalidRequestError("The uploaded file is empty.")

    service.submit(job_id, path, training_config)
    return TrainingJobAccepted(job_id=job_id)


@router.get("/jobs/{job_id}", response_model=TrainingJob)
def get_training_job(job_id: str, service: TrainingService = Depends(get_training_service)) -> TrainingJob:
    return service.get(job_id)