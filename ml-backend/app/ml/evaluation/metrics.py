import numpy as np
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
)

from app.schemas.training import ConfusionMatrix, ModelMetrics


def _clip(value: float) -> float:
    return float(min(max(value, 0.0), 1.0))


def find_best_threshold(y_true, y_proba, default: float = 0.5) -> float:
    """Decision threshold that maximises F1 on validation data."""
    precision, recall, thresholds = precision_recall_curve(y_true, y_proba)

    if len(thresholds) == 0:
        return default

    numerator = 2 * precision[:-1] * recall[:-1]
    denominator = precision[:-1] + recall[:-1]
    f1 = np.divide(numerator, denominator, out=np.zeros_like(denominator), where=denominator > 0)
    return float(np.clip(thresholds[int(np.argmax(f1))], 0.01, 0.99))


def compute_metrics(y_true, y_proba, threshold: float) -> ModelMetrics:
    y_true = np.asarray(y_true)
    y_proba = np.asarray(y_proba)
    y_pred = (y_proba >= threshold).astype(int)

    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0

    return ModelMetrics(
        accuracy=_clip(accuracy_score(y_true, y_pred)),
        precision=_clip(precision_score(y_true, y_pred, zero_division=0)),
        recall=_clip(recall_score(y_true, y_pred, zero_division=0)),
        f1_score=_clip(f1_score(y_true, y_pred, zero_division=0)),
        specificity=_clip(float(specificity)),
        roc_auc=_clip(roc_auc_score(y_true, y_proba)),
        pr_auc=_clip(average_precision_score(y_true, y_proba)),
        threshold=_clip(threshold),
        test_samples=int(len(y_true)),
        confusion_matrix=ConfusionMatrix(
            true_negative=int(tn),
            false_positive=int(fp),
            false_negative=int(fn),
            true_positive=int(tp),
        ),
    )