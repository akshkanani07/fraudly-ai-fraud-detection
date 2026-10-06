import re
import warnings

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer, make_column_selector
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.schemas.common import Algorithm
from app.schemas.models import FeatureSchemaItem

_TIME_NAME = re.compile(r"(date|time|timestamp)", re.IGNORECASE)
_AMOUNT_NAME = re.compile(r"(amount|amt|value|balance|price|total)", re.IGNORECASE)
TOP_CATEGORIES = 20


def _is_numeric(series: pd.Series) -> bool:
    return bool(pd.api.types.is_numeric_dtype(series) or pd.api.types.is_bool_dtype(series))


def _parse_datetime(series: pd.Series) -> pd.Series:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        return pd.to_datetime(series, errors="coerce", utc=True)


class FeatureEngineer(BaseEstimator, TransformerMixin):
    """Feature engineering that is fitted once and replayed identically at prediction time.

    - date/time-like text columns become hour, day-of-week, month and weekend flag
    - skewed non-negative amount-like columns get a log1p companion feature
    - everything else is normalised to float (numeric) or clean text (categorical)
    """

    def fit(self, X, y=None):
        frame = self._frame(X)
        self.input_columns_ = list(frame.columns)
        self.numeric_columns_ = [c for c in frame.columns if _is_numeric(frame[c])]
        self.datetime_columns_ = []
        self.log_columns_ = []

        for column in frame.columns:
            if column in self.numeric_columns_ or not _TIME_NAME.search(str(column)):
                continue
            sample = frame[column].dropna().head(200)
            if len(sample) and _parse_datetime(sample).notna().mean() >= 0.9:
                self.datetime_columns_.append(column)

        for column in self.numeric_columns_:
            if not _AMOUNT_NAME.search(str(column)):
                continue
            values = pd.to_numeric(frame[column], errors="coerce").dropna()
            if len(values) and values.min() >= 0 and values.skew() > 1.0:
                self.log_columns_.append(column)

        return self

    def transform(self, X):
        frame = self._frame(X).reindex(columns=self.input_columns_)
        parts: dict[str, pd.Series] = {}

        for column in self.input_columns_:
            series = frame[column]

            if column in self.datetime_columns_:
                parsed = _parse_datetime(series)
                parts[f"{column}_hour"] = parsed.dt.hour.astype("float64")
                parts[f"{column}_dayofweek"] = parsed.dt.dayofweek.astype("float64")
                parts[f"{column}_month"] = parsed.dt.month.astype("float64")
                weekend = (parsed.dt.dayofweek >= 5).astype("float64")
                parts[f"{column}_is_weekend"] = weekend.where(parsed.notna())
            elif column in self.numeric_columns_:
                numeric = pd.to_numeric(series, errors="coerce").astype("float64")
                parts[column] = numeric
                if column in self.log_columns_:
                    parts[f"{column}_log"] = np.log1p(numeric.clip(lower=0))
            else:
                text = series.astype(object)
                text = text.where(text.isna(), text.astype(str))
                parts[column] = text.where(text.notna(), np.nan)

        return pd.DataFrame(parts, index=frame.index)

    def _frame(self, X) -> pd.DataFrame:
        if isinstance(X, pd.DataFrame):
            return X
        return pd.DataFrame(X, columns=getattr(self, "input_columns_", None))


def build_pipeline(algorithm: Algorithm, estimator) -> Pipeline:
    numeric_steps = [("imputer", SimpleImputer(strategy="median", keep_empty_features=True))]
    if algorithm == Algorithm.LOGISTIC_REGRESSION:
        numeric_steps.append(("scaler", StandardScaler()))

    categorical = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="infrequent_if_exist",
                    min_frequency=0.002,
                    max_categories=25,
                    sparse_output=False,
                ),
            ),
        ]
    )

    preprocess = ColumnTransformer(
        transformers=[
            ("num", Pipeline(numeric_steps), make_column_selector(dtype_include=np.number)),
            ("cat", categorical, make_column_selector(dtype_exclude=np.number)),
        ],
        remainder="drop",
        sparse_threshold=0.0,
    )

    return Pipeline([("engineer", FeatureEngineer()), ("preprocess", preprocess), ("model", estimator)])


def categorical_columns_of(preprocess: ColumnTransformer) -> list[str]:
    for name, _, columns in preprocess.transformers_:
        if name == "cat":
            return [str(column) for column in columns]
    return []


def aggregate_by_column(names, values, categorical_columns: list[str]) -> dict[str, float]:
    """Sums values of one-hot encoded columns back onto their source column."""
    ordered = sorted(categorical_columns, key=len, reverse=True)
    totals: dict[str, float] = {}

    for name, value in zip(names, values, strict=False):
        prefix, _, rest = str(name).partition("__")
        column = rest
        if prefix == "cat":
            column = next((c for c in ordered if rest.startswith(f"{c}_")), rest)
        totals[column] = totals.get(column, 0.0) + float(value)

    return totals


def _number(value: float) -> float | None:
    return None if value is None or not np.isfinite(value) else round(float(value), 4)


def build_feature_schema(X: pd.DataFrame) -> list[FeatureSchemaItem]:
    items: list[FeatureSchemaItem] = []

    for column in X.columns:
        series = X[column]
        missing = round(float(series.isna().mean() * 100), 2)

        if _is_numeric(series):
            numeric = pd.to_numeric(series, errors="coerce").astype("float64")
            items.append(
                FeatureSchemaItem(
                    name=str(column),
                    kind="numeric",
                    min=_number(numeric.min()),
                    max=_number(numeric.max()),
                    mean=_number(numeric.mean()),
                    example=_number(numeric.median()),
                    missing_percentage=missing,
                )
            )
            continue

        text = series.dropna().astype(str)
        if _TIME_NAME.search(str(column)):
            categories: list[str] = []
            example = str(text.iloc[0]) if len(text) else None
        else:
            categories = [str(v) for v in text.value_counts().index[:TOP_CATEGORIES]]
            example = categories[0] if categories else None

        items.append(
            FeatureSchemaItem(
                name=str(column),
                kind="categorical",
                example=example,
                categories=categories,
                missing_percentage=missing,
            )
        )

    return items