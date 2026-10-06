import numpy as np
import pandas as pd
import pytest

from app.schemas.prediction import PredictionRequest
from app.schemas.training import TrainingConfig


@pytest.fixture
def services(tmp_path, monkeypatch):
    monkeypatch.setenv("ML_API_KEY", "k" * 40)
    monkeypatch.setenv("MODELS_DIR", str(tmp_path / "models"))
    monkeypatch.setenv("DATASETS_DIR", str(tmp_path / "datasets"))

    from app.core.config import get_settings
    from app.services.model_registry import ModelRegistry
    from app.services.prediction_service import PredictionService
    from app.services.training_service import TrainingService

    get_settings.cache_clear()
    settings = get_settings()
    registry = ModelRegistry(settings.models_dir)
    yield TrainingService(settings, registry), PredictionService(registry), registry
    get_settings.cache_clear()


def _dataset(path, rows: int = 4000) -> None:
    rng = np.random.default_rng(7)
    stamps = pd.Timestamp("2026-01-01") + pd.to_timedelta(rng.integers(0, 60 * 24 * 60, rows), unit="m")
    amount = np.round(rng.exponential(150, rows), 2)
    hour = stamps.hour.to_numpy()

    pd.DataFrame(
        {
            "transaction_id": [f"TX{i}" for i in range(rows)],
            "amount": amount,
            "timestamp": stamps.strftime("%Y-%m-%d %H:%M:%S"),
            "category": rng.choice(["grocery", "travel", "electronics", "fuel"], rows),
            "is_fraud": ((amount > 400) & (hour < 6)).astype(int),
        }
    ).to_csv(path, index=False)


def test_train_predict_explain(tmp_path, services):
    training, prediction, registry = services
    csv_path = tmp_path / "data.csv"
    _dataset(csv_path)

    job = training.run_blocking(
        "job_test",
        csv_path,
        TrainingConfig(model_name="Smoke", target_column="is_fraud", algorithms=["LOGISTIC_REGRESSION", "RANDOM_FOREST", "XGBOOST"]),
    )

    assert job.status == "COMPLETED", job.error
    assert job.result is not None
    assert len(registry.list_summaries()) == 3
    assert "transaction_id" in job.result.cleaning_summary.id_like_columns_dropped

    for result in job.result.results:
        model_id = result.model_id
        risky = prediction.predict(
            PredictionRequest(
                model_id=model_id,
                features={"amount": 900, "timestamp": "2026-02-01 02:15:00", "category": "electronics"},
            )
        )
        safe = prediction.predict(
            PredictionRequest(
                model_id=model_id,
                features={"amount": 20, "timestamp": "2026-02-01 14:00:00", "category": "grocery"},
            )
        )

        assert 0.0 <= safe.fraud_probability <= 1.0
        assert risky.fraud_probability > safe.fraud_probability
        assert risky.factors, "explanations should not be empty"