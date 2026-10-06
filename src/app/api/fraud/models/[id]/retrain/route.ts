import { NextResponse } from "next/server";

import { ApiError, recordAudit, withApi } from "@/features/fraud-detection/server/api-utils";
import { assertApiPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { mlRetrainModel } from "@/lib/ml/ml-client";

export const runtime = "nodejs";

export const POST = withApi<{ id: string }>(async (request, { params }) => {
  const session = await assertApiPermission({ model: ["retrain"] });
  const row = await prisma.mlModel.findUnique({ where: { id: (await params).id } });

  if (!row?.mlModelId) throw new ApiError(404, "Model not found", "model_not_found");

  const { jobId } = await mlRetrainModel(row.mlModelId);

  await recordAudit({
    userId: session.user.id,
    action: "model.retrain",
    entity: "MlModel",
    entityId: row.id,
    metadata: { jobId },
    request,
  });

  return NextResponse.json({ jobId }, { status: 202 });
});