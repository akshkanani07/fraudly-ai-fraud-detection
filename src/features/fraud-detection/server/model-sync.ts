import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createLogger } from "@/lib/logger/logger";
import { mlListModels } from "@/lib/ml/ml-client";

import {
  ALGORITHM_LABELS,
  type Algorithm,
  type ConfusionMatrix,
  type FeatureImportanceItem,
  type MlModelSummary,
  type ModelRow,
  type ModelStatus,
} from "../types";

const log = createLogger("fraud-model-sync");

export type ModelWithCount = Prisma.MlModelGetPayload<{
  include: { _count: { select: { predictions: true } } };
}>;

export const modelInclude = { _count: { select: { predictions: true } } } as const;

function normalizeFeatureImportance(value: Prisma.JsonValue | null): FeatureImportanceItem[] | null {
  if (value === null) return null;

  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const { feature, importance } = item;
      return typeof feature === "string" && typeof importance === "number" && Number.isFinite(importance)
        ? [{ feature, importance }]
        : [];
    });
  }

  if (typeof value === "object") {
    return Object.entries(value).flatMap(([feature, importance]) =>
      typeof importance === "number" && Number.isFinite(importance) ? [{ feature, importance }] : [],
    );
  }

  return null;
}

export function toModelRow(row: ModelWithCount): ModelRow {
  return {
    id: row.id,
    mlModelId: row.mlModelId,
    name: row.name,
    version: row.version,
    algorithm: row.algorithm as Algorithm,
    status: row.status as ModelStatus,
    isActive: row.isActive,
    accuracy: row.accuracy,
    precision: row.precision,
    recall: row.recall,
    f1Score: row.f1Score,
    rocAuc: row.rocAuc,
    confusionMatrix: row.confusionMatrix as ConfusionMatrix | null,
    featureColumns: row.featureColumns as string[] | null,
    featureImportance: normalizeFeatureImportance(row.featureImportance),
    hyperparameters: row.hyperparameters as Record<string, unknown> | null,
    trainingRows: row.trainingRows,
    trainedAt: row.trainedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    predictionCount: row._count.predictions,
  };
}

function displayName(summary: MlModelSummary): string {
  return `${summary.name} \u00b7 ${ALGORITHM_LABELS[summary.algorithm]}`;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Mirrors models trained by the ML service into the database (idempotent).
 * Models that already exist are skipped, so it is safe to call on every request.
 */
export async function syncModelsFromMl(userId?: string): Promise<void> {
  const summaries = await mlListModels();
  if (summaries.length === 0) return;

  const known = new Set(
    (
      await prisma.mlModel.findMany({
        where: { mlModelId: { in: summaries.map((summary) => summary.modelId) } },
        select: { mlModelId: true },
      })
    ).map((row) => row.mlModelId),
  );

  const fresh = summaries
    .filter((summary) => !known.has(summary.modelId))
    .sort((a, b) => a.trainedAt.localeCompare(b.trainedAt));

  if (fresh.length === 0) return;

  let newestBest: MlModelSummary | undefined;

  for (const summary of fresh) {
    const name = displayName(summary);
    const latest = await prisma.mlModel.findFirst({
      where: { name },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    try {
      await prisma.mlModel.create({
        data: {
          mlModelId: summary.modelId,
          name,
          version: (latest?.version ?? 0) + 1,
          algorithm: summary.algorithm,
          status: "READY",
          isActive: false,
          trainedById: userId ?? null,
          hyperparameters: summary.hyperparameters as Prisma.InputJsonValue,
          featureColumns: summary.featureColumns as Prisma.InputJsonValue,
          featureImportance: summary.featureImportance as unknown as Prisma.InputJsonValue,
          trainingRows: summary.trainingRows,
          accuracy: summary.metrics.accuracy,
          precision: summary.metrics.precision,
          recall: summary.metrics.recall,
          f1Score: summary.metrics.f1Score,
          rocAuc: summary.metrics.rocAuc,
          confusionMatrix: summary.metrics.confusionMatrix as unknown as Prisma.InputJsonValue,
          trainedAt: new Date(summary.trainedAt),
        },
      });

      if (summary.isBestInRun) newestBest = summary;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }

  const active = await prisma.mlModel.findFirst({
    where: { isActive: true, status: "READY" },
    select: { id: true },
  });

  if (!active && newestBest) {
    await prisma.mlModel.updateMany({ where: { mlModelId: newestBest.modelId }, data: { isActive: true } });
  }

  log.info({ synced: fresh.length }, "Synced models from the ML service");
}