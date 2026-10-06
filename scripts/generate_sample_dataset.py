"""Generates a realistic synthetic fraud dataset for trying out Fraudly.

Run from the project root:
  .\\ml-backend\\.venv\\Scripts\\python.exe scripts\\generate_sample_dataset.py
"""

from pathlib import Path

import numpy as np
import pandas as pd

ROWS = 20_000
TARGET_FRAUD_RATE = 0.03
OUTPUT = Path(__file__).parent / "sample_transactions.csv"


def calibrate(score: np.ndarray, target: float) -> float:
    low, high = -40.0, 40.0
    for _ in range(80):
        mid = (low + high) / 2
        rate = (1 / (1 + np.exp(-(score + mid)))).mean()
        low, high = (low, mid) if rate > target else (mid, high)
    return (low + high) / 2


def main() -> None:
    rng = np.random.default_rng(42)

    amount = np.round(rng.lognormal(mean=3.6, sigma=1.1, size=ROWS), 2)
    stamps = pd.Timestamp("2026-01-01") + pd.to_timedelta(rng.integers(0, 60 * 24 * 150, ROWS), unit="m")
    hour = stamps.hour.to_numpy()

    category = rng.choice(
        ["Groceries", "Electronics", "Travel", "Fuel", "Dining", "Fashion", "Gaming", "Utilities"],
        ROWS, p=[0.22, 0.12, 0.08, 0.14, 0.18, 0.1, 0.06, 0.1],
    )
    merchant = rng.choice(
        ["Nova Electronics", "Orbit Travel", "City Grocers", "Fuel Stop", "Urban Bites", "Style Hub",
         "Pixel Games", "PowerGrid", "SkyMiles Air", "QuickMart", "Gadget World", "Bistro 21"],
        ROWS,
    )
    channel = rng.choice(["ONLINE", "POS", "ATM", "MOBILE", "TRANSFER"], ROWS, p=[0.4, 0.3, 0.08, 0.17, 0.05])
    country = rng.choice(["US", "GB", "IN", "DE", "AE", "NG", "BR"], ROWS, p=[0.4, 0.12, 0.2, 0.08, 0.08, 0.06, 0.06])
    device_age_days = rng.integers(0, 1500, ROWS)
    distance_km = np.round(rng.exponential(25, ROWS), 1)
    tx_count_24h = rng.poisson(2.5, ROWS)
    is_foreign = (rng.random(ROWS) < 0.12).astype(int)

    score = (
        0.9 * np.log10(amount + 1)
        + 1.4 * (hour < 5)
        + 0.012 * np.minimum(distance_km, 400)
        + 0.5 * (channel == "ONLINE")
        + 0.7 * np.isin(category, ["Electronics", "Gaming", "Travel"])
        + 1.5 * is_foreign
        + 1.2 * (device_age_days < 30)
        + 0.25 * np.maximum(tx_count_24h - 4, 0)
        + 0.8 * np.isin(country, ["NG", "BR"])
    )
    probability = 1 / (1 + np.exp(-(score + calibrate(score, TARGET_FRAUD_RATE))))

    frame = pd.DataFrame(
        {
            "transaction_id": [f"TX{100000 + i}" for i in range(ROWS)],
            "timestamp": stamps.strftime("%Y-%m-%d %H:%M:%S"),
            "amount": amount,
            "merchant": merchant,
            "category": category,
            "channel": channel,
            "country": country,
            "device_age_days": device_age_days,
            "distance_from_home_km": distance_km,
            "tx_count_24h": tx_count_24h,
            "is_foreign": is_foreign,
            "is_fraud": (rng.random(ROWS) < probability).astype(int),
        }
    )

    frame.to_csv(OUTPUT, index=False)
    print(f"Saved {len(frame):,} rows to {OUTPUT} | fraud rate: {frame['is_fraud'].mean():.2%}")


if __name__ == "__main__":
    main()