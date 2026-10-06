from datetime import datetime, timezone
from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class APIModel(BaseModel):
    """Base class for every request/response model.

    Python code uses snake_case, the JSON API uses camelCase. Both spellings are
    accepted on input.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        protected_namespaces=(),
        str_strip_whitespace=True,
    )


class Algorithm(StrEnum):
    """Values match the MlAlgorithm enum in the Prisma schema."""

    LOGISTIC_REGRESSION = "LOGISTIC_REGRESSION"
    RANDOM_FOREST = "RANDOM_FOREST"
    XGBOOST = "XGBOOST"


class RiskLevel(StrEnum):
    """Values match the RiskLevel enum in the Prisma schema."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class JobStatus(StrEnum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


Probability = Annotated[float, Field(ge=0.0, le=1.0)]


class HealthResponse(APIModel):
    status: str = "ok"
    service: str
    version: str
    environment: str
    timestamp: datetime = Field(default_factory=utc_now)


class ErrorResponse(APIModel):
    detail: str
    code: str | None = None


class MessageResponse(APIModel):
    message: str