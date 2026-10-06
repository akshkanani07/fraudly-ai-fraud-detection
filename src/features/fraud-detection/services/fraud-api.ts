import axios, { isAxiosError } from "axios";

import type {
  FeatureValue,
  FraudOverview,
  ModelDetail,
  ModelRow,
  PredictionHistoryPage,
  PredictionResult,
  TrainingJob,
} from "../types";
import type { PredictionsQuery, TrainingConfigValues } from "../schemas/fraud.schemas";

const http = axios.create({ baseURL: "/api/fraud", timeout: 120_000 });

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message;
    if (message) return message;
    if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
    if (!error.response) return "Network error. Check your connection and try again.";
  }
  return error instanceof Error ? error.message : fallback;
}

export const fraudApi = {
  overview: async () => (await http.get<FraudOverview>("/overview")).data,

  models: async () => (await http.get<{ models: ModelRow[]; mlOnline: boolean }>("/models")).data,

  model: async (id: string) => (await http.get<ModelDetail>(`/models/${id}`)).data,

  activateModel: async (id: string) => (await http.patch(`/models/${id}`, { isActive: true })).data,

  deleteModel: async (id: string) =>
    (await http.delete<{ result: "deleted" | "archived" }>(`/models/${id}`)).data,

  retrainModel: async (id: string) => (await http.post<{ jobId: string }>(`/models/${id}/retrain`)).data,

  startTraining: async (file: File, config: TrainingConfigValues) => {
    const form = new FormData();
    form.append("file", file);
    form.append("config", JSON.stringify(config));
    return (await http.post<{ jobId: string }>("/training", form)).data;
  },

  trainingJob: async (jobId: string) => (await http.get<TrainingJob>(`/training/${jobId}`)).data,

  predict: async (body: { modelId?: string; features: Record<string, FeatureValue>; explain: boolean }) =>
    (await http.post<PredictionResult>("/predict", body)).data,

  predictions: async (params: PredictionsQuery) =>
    (await http.get<PredictionHistoryPage>("/predictions", { params })).data,
};