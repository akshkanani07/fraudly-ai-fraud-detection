import { z } from "zod";

import { ALGORITHMS, RISK_LEVELS, SELECTION_METRICS } from "../types";

export const MAX_DATASET_SIZE_BYTES = 100 * 1024 * 1024;

export const trainingConfigSchema = z.object({
  modelName: z.string().trim().min(2, "Model name must be at least 2 characters").max(80),
  targetColumn: z.string().trim().min(1, "Select the target column"),
  positiveLabel: z.string().trim().max(60),
  algorithms: z.array(z.enum(ALGORITHMS)).min(1, "Select at least one algorithm"),
  selectionMetric: z.enum(SELECTION_METRICS),
  handleImbalance: z.boolean(),
  optimizeThreshold: z.boolean(),
});

export type TrainingConfigValues = z.infer<typeof trainingConfigSchema>;

export const predictRequestSchema = z.object({
  modelId: z.string().min(1).optional(),
  features: z
    .record(
      z.string().min(1).max(200),
      z.union([z.string().max(500), z.number(), z.boolean(), z.null()]),
    )
    .refine((value) => {
      const count = Object.keys(value).length;
      return count > 0 && count <= 500;
    }, "Provide between 1 and 500 feature values"),
  explain: z.boolean().default(true),
});

export type PredictRequest = z.input<typeof predictRequestSchema>;

export const predictionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  risk: z.enum(RISK_LEVELS).optional(),
  verdict: z.enum(["fraud", "legit"]).optional(),
});

export type PredictionsQuery = z.input<typeof predictionsQuerySchema>;