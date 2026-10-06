import logging
import re
from pathlib import Path

import pandas as pd

from app.core.errors import DatasetError
from app.schemas.training import CleaningSummary, ColumnProfile, DatasetProfile

logger = logging.getLogger(__name__)

MIN_ROWS = 100
MIN_CLASS_SAMPLES = 30
HIGH_MISSING_RATIO = 0.6
MAX_PROFILED_COLUMNS = 200
TARGET_TMP = "__fraudly_target__"

POSITIVE_TOKENS = {"1", "true", "yes", "y", "t", "fraud", "fraudulent", "positive", "anomaly", "chargeback"}
NEGATIVE_TOKENS = {
    "0", "false", "no", "n", "f", "legit", "legitimate", "genuine", "normal",
    "negative", "non-fraud", "nonfraud", "not fraud", "valid",
}
_ID_NAME = re.compile(r"(^|[_\s-])(id|uuid|guid|index)$", re.IGNORECASE)
_TIME_NAME = re.compile(r"(date|time|timestamp)", re.IGNORECASE)


def load_dataframe(path: Path) -> pd.DataFrame:
    frame: pd.DataFrame | None = None
    used_encoding = "utf-8-sig"

    for encoding in ("utf-8-sig", "latin-1"):
        try:
            frame = pd.read_csv(path, encoding=encoding, low_memory=False)
            used_encoding = encoding
            break
        except UnicodeDecodeError:
            continue
        except pd.errors.EmptyDataError as error:
            raise DatasetError("The uploaded file is empty.") from error
        except pd.errors.ParserError as error:
            raise DatasetError(f"The file could not be parsed as CSV: {error}") from error

    if frame is None:
        raise DatasetError("The file encoding is not supported. Save it as a UTF-8 CSV.")

    if frame.shape[1] == 1 and re.search(r"[;\t|]", str(frame.columns[0])):
        try:
            frame = pd.read_csv(path, sep=None, engine="python", encoding=used_encoding)
        except (pd.errors.ParserError, pd.errors.EmptyDataError) as error:
            raise DatasetError("The file delimiter could not be detected.") from error

    frame.columns = [str(column).strip() for column in frame.columns]

    if len(frame) < MIN_ROWS:
        raise DatasetError(f"The dataset needs at least {MIN_ROWS} rows, found {len(frame)}.")

    return frame


def _normalise(series: pd.Series) -> pd.Series:
    return series.astype(str).str.strip().str.lower().str.replace(r"\.0+$", "", regex=True)


def resolve_target(series: pd.Series, positive_label: str | int | bool | None) -> pd.Series:
    """Converts the target column to 0/1 (1 = fraud). The series must have no missing values."""
    normalised = _normalise(series)

    if positive_label is not None and str(positive_label).strip() != "":
        label = re.sub(r"\.0+$", "", str(positive_label).strip().lower())
        positives = normalised == label
        if not positives.any():
            raise DatasetError(f"The positive label '{positive_label}' was not found in the target column.")
        return positives.astype("int8")

    values = set(normalised.unique())

    if len(values) < 2:
        raise DatasetError("The target column must contain both fraud and legitimate examples.")

    if values <= (POSITIVE_TOKENS | NEGATIVE_TOKENS):
        return normalised.isin(POSITIVE_TOKENS).astype("int8")

    if len(values) == 2:
        numeric = pd.to_numeric(series, errors="coerce")
        if numeric.notna().all():
            return (numeric == numeric.max()).astype("int8")

    raise DatasetError(
        f"Could not infer which target value means fraud ({len(values)} distinct values found). "
        "Set the positive label explicitly."
    )


def clean_dataset(
    frame: pd.DataFrame,
    *,
    target_column: str,
    positive_label: str | int | bool | None,
    drop_columns: list[str],
    feature_columns: list[str] | None,
) -> tuple[pd.DataFrame, pd.Series, CleaningSummary, DatasetProfile]:
    if target_column not in frame.columns:
        preview = ", ".join(map(str, list(frame.columns)[:15]))
        raise DatasetError(f"Target column '{target_column}' was not found. Columns: {preview}")

    original_rows = len(frame)
    missing_target = int(frame[target_column].isna().sum())
    frame = frame.loc[frame[target_column].notna()]

    target = resolve_target(frame[target_column], positive_label)
    combined = frame.drop(columns=[target_column]).copy()
    combined[TARGET_TMP] = target.to_numpy()

    duplicate_mask = combined.duplicated()
    duplicates_removed = int(duplicate_mask.sum())
    combined = combined.loc[~duplicate_mask]

    y = combined.pop(TARGET_TMP).astype("int8")
    X = combined

    if feature_columns is not None:
        unknown = [column for column in feature_columns if column not in X.columns]
        if unknown:
            raise DatasetError(f"Feature columns not found in the dataset: {', '.join(unknown)}")
        X = X[feature_columns]
    else:
        X = X.drop(columns=[column for column in drop_columns if column in X.columns])

    constant: list[str] = []
    high_missing: list[str] = []
    id_like: list[str] = []

    for column in list(X.columns):
        series = X[column]
        non_null = series.dropna()
        unique_count = int(non_null.nunique())

        if unique_count <= 1:
            constant.append(column)
            continue
        if float(series.isna().mean()) > HIGH_MISSING_RATIO:
            high_missing.append(column)
            continue

        unique_ratio = unique_count / max(len(non_null), 1)
        is_numeric = pd.api.types.is_numeric_dtype(series)
        if unique_ratio > 0.9 and unique_count > 50 and not _TIME_NAME.search(column):
            if not is_numeric or _ID_NAME.search(column):
                id_like.append(column)

    X = X.drop(columns=constant + high_missing + id_like)

    if X.shape[1] == 0:
        raise DatasetError("No usable feature columns remain after cleaning.")
    if len(X) < MIN_ROWS:
        raise DatasetError(f"Only {len(X)} rows remain after cleaning; at least {MIN_ROWS} are required.")

    fraud_count = int(y.sum())
    legitimate_count = int(len(y) - fraud_count)

    if fraud_count < MIN_CLASS_SAMPLES or legitimate_count < MIN_CLASS_SAMPLES:
        raise DatasetError(
            f"At least {MIN_CLASS_SAMPLES} fraud and {MIN_CLASS_SAMPLES} legitimate examples are required "
            f"(found {fraud_count} fraud, {legitimate_count} legitimate)."
        )

    summary = CleaningSummary(
        original_rows=original_rows,
        final_rows=len(X),
        duplicate_rows_removed=duplicates_removed,
        rows_dropped_missing_target=missing_target,
        constant_columns_dropped=constant,
        high_missing_columns_dropped=high_missing,
        id_like_columns_dropped=id_like,
        missing_values_imputed=int(X.isna().sum().sum()),
    )

    profile = DatasetProfile(
        row_count=len(X),
        column_count=X.shape[1],
        duplicate_rows=duplicates_removed,
        fraud_count=fraud_count,
        legitimate_count=legitimate_count,
        fraud_rate=fraud_count / len(y),
        columns=[
            ColumnProfile(
                name=str(column),
                dtype=str(X[column].dtype),
                is_numeric=bool(pd.api.types.is_numeric_dtype(X[column])),
                missing_count=int(X[column].isna().sum()),
                missing_percentage=round(float(X[column].isna().mean() * 100), 2),
                unique_count=int(X[column].nunique(dropna=True)),
            )
            for column in list(X.columns)[:MAX_PROFILED_COLUMNS]
        ],
    )

    logger.info(
        "Dataset cleaned",
        extra={"rows": len(X), "columns": X.shape[1], "fraud_rate": round(fraud_count / len(y), 4)},
    )
    return X.reset_index(drop=True), y.reset_index(drop=True), summary, profile