import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any

SERVICE_NAME = "fraudly-ml"

_STANDARD_RECORD_ATTRIBUTES = set(
    logging.LogRecord("", 0, "", 0, "", (), None).__dict__.keys()
) | {"message", "asctime", "taskName"}

_SENSITIVE_KEYS = {"password", "token", "secret", "api_key", "apikey", "authorization", "cookie"}


class JsonFormatter(logging.Formatter):
    """Formats log records as single-line JSON, matching the Next.js (Pino) logs."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "time": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname.lower(),
            "service": SERVICE_NAME,
            "logger": record.name,
            "message": record.getMessage(),
        }

        for key, value in record.__dict__.items():
            if key in _STANDARD_RECORD_ATTRIBUTES or key.startswith("_"):
                continue
            payload[key] = "[REDACTED]" if key.lower() in _SENSITIVE_KEYS else value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str, ensure_ascii=False)


def configure_logging(level: str = "INFO") -> None:
    """Configures root logging once at application start."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Let uvicorn / fastapi logs flow through the same JSON handler.
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        logger = logging.getLogger(name)
        logger.handlers.clear()
        logger.propagate = True

    logging.getLogger("matplotlib").setLevel(logging.WARNING)
    logging.getLogger("numba").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)