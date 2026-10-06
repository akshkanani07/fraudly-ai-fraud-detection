import { NextResponse } from "next/server";

import { ApiError, recordAudit, withApi } from "@/features/fraud-detection/server/api-utils";
import { MAX_DATASET_SIZE_BYTES, trainingConfigSchema } from "@/features/fraud-detection/schemas/fraud.schemas";
import { assertApiPermission } from "@/lib/auth/session";
import { mlStartTraining } from "@/lib/ml/ml-client";

export const runtime = "nodejs";
export const maxDuration = 300;

export const POST = withApi(async (request) => {
  const session = await assertApiPermission({ model: ["train"] });

  const form = await request.formData();
  const file = form.get("file");
  const rawConfig = form.get("config");

  if (!(file instanceof File)) throw new ApiError(422, "A CSV file is required", "file_required");
  if (typeof rawConfig !== "string") throw new ApiError(422, "Training configuration is required", "config_required");
  if (!file.name.toLowerCase().endsWith(".csv")) throw new ApiError(422, "Only CSV files are supported", "invalid_file");
  if (file.size === 0 || file.size > MAX_DATASET_SIZE_BYTES) {
    throw new ApiError(422, "The file must be between 1 byte and 100 MB", "invalid_file_size");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawConfig);
  } catch {
    throw new ApiError(422, "Training configuration is not valid JSON", "invalid_config");
  }

  const config = trainingConfigSchema.parse(parsed);
  const { jobId } = await mlStartTraining(file, { ...config, positiveLabel: config.positiveLabel || undefined });

  await recordAudit({
    userId: session.user.id,
    action: "model.train",
    entity: "TrainingJob",
    entityId: jobId,
    metadata: { name: config.modelName, algorithms: config.algorithms, fileName: file.name },
    request,
  });

  return NextResponse.json({ jobId }, { status: 202 });
});