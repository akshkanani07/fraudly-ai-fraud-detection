from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Application settings, loaded from environment variables and ml-backend/.env."""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "Fraudly ML Service"
    app_version: str = "1.0.0"
    environment: Literal["development", "test", "production"] = "development"
    api_prefix: str = "/api/v1"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    # Shared secret between the Next.js server and this service.
    ml_api_key: SecretStr

    # Comma separated list of origins allowed by CORS.
    allowed_origins: str = "http://localhost:3000"

    models_dir: Path = BASE_DIR / "models"
    datasets_dir: Path = BASE_DIR / "datasets"
    max_upload_size_mb: int = Field(default=100, ge=1, le=1024)

    # Machine learning defaults
    random_state: int = 42
    test_size: float = Field(default=0.2, gt=0.0, lt=0.5)
    cv_folds: int = Field(default=5, ge=2, le=10)
    default_fraud_threshold: float = Field(default=0.5, gt=0.0, lt=1.0)

    @field_validator("ml_api_key")
    @classmethod
    def validate_api_key_length(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value()) < 32:
            raise ValueError("ML_API_KEY must be at least 32 characters long")
        return value

    @field_validator("models_dir", "datasets_dir")
    @classmethod
    def resolve_directory(cls, value: Path) -> Path:
        return value if value.is_absolute() else (BASE_DIR / value).resolve()

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    def ensure_directories(self) -> None:
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.datasets_dir.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()  # type: ignore[call-arg]
    settings.ensure_directories()
    return settings