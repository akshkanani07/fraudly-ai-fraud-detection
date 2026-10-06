export const ALGORITHMS = ["LOGISTIC_REGRESSION", "RANDOM_FOREST", "XGBOOST"] as const;
export type Algorithm = (typeof ALGORITHMS)[number];

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const SELECTION_METRICS = ["pr_auc", "f1", "roc_auc", "recall", "precision"] as const;
export type SelectionMetric = (typeof SELECTION_METRICS)[number];

export type JobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
export type ModelStatus = "TRAINING" | "READY" | "FAILED" | "ARCHIVED";

export const ALGORITHM_LABELS: Record<Algorithm, string> = {
  LOGISTIC_REGRESSION: "Logistic Regression",
  RANDOM_FOREST: "Random Forest",
  XGBOOST: "XGBoost",
};

export const SELECTION_METRIC_LABELS: Record<SelectionMetric, string> = {
  pr_auc: "PR-AUC (best for imbalanced data)",
  f1: "F1 Score",
  roc_auc: "ROC-AUC",
  recall: "Recall",
  precision: "Precision",
};

export type FeatureValue = string | number | boolean | null;

export interface ConfusionMatrix {
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
  truePositive: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  specificity: number;
  rocAuc: number;
  prAuc: number;
  threshold: number;
  testSamples: number;
  confusionMatrix: ConfusionMatrix;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface FeatureSchemaItem {
  name: string;
  kind: "numeric" | "categorical";
  min: number | null;
  max: number | null;
  mean: number | null;
  example: string | number | null;
  categories: string[];
  missingPercentage: number;
}

export interface FraudFactor {
  feature: string;
  value: FeatureValue;
  contribution: number;
  direction: "increases_risk" | "decreases_risk";
}

/** Model summary as returned by the Python ML service. */
export interface MlModelSummary {
  modelId: string;
  runId: string;
  name: string;
  algorithm: Algorithm;
  targetColumn: string;
  featureColumns: string[];
  featureSchema: FeatureSchemaItem[];
  metrics: ModelMetrics;
  featureImportance: FeatureImportanceItem[];
  hyperparameters: Record<string, unknown>;
  trainingRows: number;
  trainingSeconds: number;
  artifactSizeBytes: number;
  selectionMetric: string;
  isBestInRun: boolean;
  trainedAt: string;
  hasDataset: boolean;
}

export interface MlPredictionResponse {
  transactionId: string | null;
  modelId: string;
  isFraud: boolean;
  fraudProbability: number;
  confidence: number;
  riskLevel: RiskLevel;
  threshold: number;
  factors: FraudFactor[];
  missingFeatures: string[];
  latencyMs: number;
  predictedAt: string;
}

/** Model as stored in the database and shown in the UI. */
export interface ModelRow {
  id: string;
  mlModelId: string | null;
  name: string;
  version: number;
  algorithm: Algorithm;
  status: ModelStatus;
  isActive: boolean;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
  rocAuc: number | null;
  confusionMatrix: ConfusionMatrix | null;
  featureColumns: string[] | null;
  featureImportance: FeatureImportanceItem[] | null;
  hyperparameters: Record<string, unknown> | null;
  trainingRows: number | null;
  trainedAt: string | null;
  createdAt: string;
  predictionCount: number;
}

export interface ModelDetail {
  model: ModelRow;
  featureSchema: FeatureSchemaItem[];
  metrics: ModelMetrics | null;
}

export interface DatasetProfile {
  rowCount: number;
  columnCount: number;
  duplicateRows: number;
  fraudCount: number;
  legitimateCount: number;
  fraudRate: number;
}

export interface CleaningSummary {
  originalRows: number;
  finalRows: number;
  duplicateRowsRemoved: number;
  rowsDroppedMissingTarget: number;
  constantColumnsDropped: string[];
  highMissingColumnsDropped: string[];
  idLikeColumnsDropped: string[];
  missingValuesImputed: number;
}

export interface AlgorithmResult {
  modelId: string;
  algorithm: Algorithm;
  metrics: ModelMetrics;
  trainingSeconds: number;
  isBest: boolean;
}

export interface TrainingResult {
  name: string;
  targetColumn: string;
  bestAlgorithm: Algorithm;
  datasetProfile: DatasetProfile;
  cleaningSummary: CleaningSummary;
  results: AlgorithmResult[];
  totalTrainingSeconds: number;
}

export interface TrainingJob {
  jobId: string;
  status: JobStatus;
  progress: number;
  stage: string | null;
  error: string | null;
  result: TrainingResult | null;
}

export interface PredictionResult {
  predictionId: string;
  transactionId: string;
  modelName: string;
  transactionStatus: string;
  isFraud: boolean;
  fraudProbability: number;
  confidence: number;
  riskLevel: RiskLevel;
  threshold: number;
  factors: FraudFactor[];
  missingFeatures: string[];
  latencyMs: number;
  predictedAt: string;
}

export interface PredictionHistoryItem {
  id: string;
  createdAt: string;
  isFraud: boolean;
  fraudProbability: number;
  confidence: number;
  riskLevel: RiskLevel;
  latencyMs: number | null;
  threshold: number | null;
  factors: FraudFactor[];
  missingFeatures: string[];
  transaction: {
    id: string;
    amount: number;
    currency: string;
    merchant: string | null;
    category: string | null;
    country: string | null;
    status: string;
  };
  model: { id: string; name: string; algorithm: Algorithm };
}

export interface PredictionHistoryPage {
  items: PredictionHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FraudOverview {
  totalPredictions: number;
  fraudPredictions: number;
  fraudRate: number;
  avgLatencyMs: number;
  riskDistribution: { level: RiskLevel; count: number }[];
  timeline: { date: string; total: number; fraud: number }[];
  activeModel: {
    id: string;
    name: string;
    algorithm: Algorithm;
    f1Score: number | null;
    precision: number | null;
    recall: number | null;
    rocAuc: number | null;
  } | null;
  mlOnline: boolean;
}