import { NextResponse } from "next/server";

import { predictRequestSchema } from "@/features/fraud-detection/schemas/fraud.schemas";
import { recordAudit, withApi } from "@/features/fraud-detection/server/api-utils";
import { runPrediction } from "@/features/fraud-detection/server/prediction-service";
import { assertApiPermission } from "@/lib/auth/session";

export const runtime = "nodejs";

export const POST = withApi(async (request) => {
  const session = await assertApiPermission({ prediction: ["create"] });
  const body = predictRequestSchema.parse(await request.json());

  const result = await runPrediction({
    userId: session.user.id,
    modelId: body.modelId,
    features: body.features,
    explain: body.explain,
  });

  await recordAudit({
    userId: session.user.id,
    action: "prediction.create",
    entity: "Prediction",
    entityId: result.predictionId,
    metadata: { isFraud: result.isFraud, riskLevel: result.riskLevel, model: result.modelName },
    request,
  });

  return NextResponse.json(result);
});