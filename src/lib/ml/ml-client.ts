import { serverEnv } from "@/config/env";
import type {
  MlModelSummary,
  MlPredictionResponse,
  TrainingJob,
} from "@/features/fraud-detection/types";

/** Server-only client for the Python ML service. Never import it in Client Components. */

export class MlServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 502, code = "ml_service_error") {
    super(message);
    this.name = "MlServiceError";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: string;
  body?: BodyInit;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

function describeDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : ""))
      .filter(Boolean)
      .join("; ");
  }
  return "The ML service rejected the request";
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, timeoutMs = 30_000 } = options;
  let response: Response;

  try {
    response = await fetch(`${serverEnv.ML_API_URL}/api/v1${path}`, {
      method,
      body,
      headers: { "X-API-Key": serverEnv.ML_API_KEY, Accept: "application/json", ...headers },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new MlServiceError(
      "The ML service is unreachable. Make sure it is running.",
      503,
      "ml_unreachable",
    );
  }

  if (!response.ok) {
    let message = "The ML service returned an error";
    let code = "ml_service_error";

    try {
      const payload = (await response.json()) as { detail?: unknown; code?: string };
      message = describeDetail(payload.detail);
      code = payload.code ?? code;
    } catch {
      // keep the default message
    }

    throw new MlServiceError(message, response.status, code);
  }

  return (await response.json()) as T;
}

function jsonBody(payload: unknown): Pick<RequestOptions, "body" | "headers"> {
  return { body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } };
}

export async function mlHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${serverEnv.ML_API_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function mlListModels(): Promise<MlModelSummary[]> {
  return (await request<{ models: MlModelSummary[] }>("/models")).models;
}

export function mlGetModel(modelId: string): Promise<MlModelSummary> {
  return request<MlModelSummary>(`/models/${encodeURIComponent(modelId)}`);
}

export function mlDeleteModel(modelId: string): Promise<{ message: string }> {
  return request(`/models/${encodeURIComponent(modelId)}`, { method: "DELETE" });
}

export function mlRetrainModel(modelId: string): Promise<{ jobId: string }> {
  return request(`/models/${encodeURIComponent(modelId)}/retrain`, { method: "POST" });
}

export function mlStartTraining(file: File, config: Record<string, unknown>): Promise<{ jobId: string }> {
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("config", JSON.stringify(config));
  return request("/training/jobs", { method: "POST", body: form, timeoutMs: 300_000 });
}

export function mlGetJob(jobId: string): Promise<TrainingJob> {
  return request<TrainingJob>(`/training/jobs/${encodeURIComponent(jobId)}`);
}

export function mlPredict(payload: {
  modelId: string;
  features: Record<string, string | number | boolean | null>;
  explain: boolean;
}): Promise<MlPredictionResponse> {
  return request<MlPredictionResponse>("/predictions", { method: "POST", ...jsonBody(payload), timeoutMs: 60_000 });
}