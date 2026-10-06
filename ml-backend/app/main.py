import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.deps import get_training_service
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import AppError
from app.core.logging import configure_logging
from app.schemas.common import HealthResponse

logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    logger.info("ML service starting", extra={"environment": settings.environment})
    yield
    get_training_service().shutdown()
    logger.info("ML service stopped")


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
        openapi_url=None if settings.is_production else "/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["X-API-Key", "Content-Type"],
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        started = time.perf_counter()
        response = await call_next(request)
        logger.info(
            "request",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round((time.perf_counter() - started) * 1000, 1),
            },
        )
        return response

    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, error: AppError) -> JSONResponse:
        return JSONResponse(status_code=error.status_code, content={"detail": error.message, "code": error.code})

    @app.exception_handler(Exception)
    async def handle_unexpected(_: Request, error: Exception) -> JSONResponse:
        logger.error("Unhandled error", exc_info=error)
        return JSONResponse(status_code=500, content={"detail": "Internal server error", "code": "internal_error"})

    app.include_router(api_router, prefix=settings.api_prefix)

    @app.get("/health", response_model=HealthResponse, tags=["system"])
    def health() -> HealthResponse:
        return HealthResponse(
            service=settings.app_name,
            version=settings.app_version,
            environment=settings.environment,
        )

    return app


app = create_app()