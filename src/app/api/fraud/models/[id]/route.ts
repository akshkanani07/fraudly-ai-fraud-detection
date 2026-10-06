import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, recordAudit, withApi } from "@/features/fraud-detection/server/api-utils";
import { modelInclude, toModelRow } from "@/features/fraud-detection/server/model-sync";
import type { MlModelSummary } from "@/features/fraud-detection/types";
import { assertApiPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { MlServiceError, mlDeleteModel, mlGetModel } from "@/lib/ml/ml-client";

export const runtime = "nodejs";

type Params = { id: string };

async function findModel(id: string) {
  const row = await prisma.mlModel.findUnique({ where: { id }, include: modelInclude });
  if (!row) throw new ApiError(404, "Model not found", "model_not_found");
  return row;
}

export const GET = withApi<Params>(async (_request, { params }) => {
  await assertApiPermission({ model: ["read"] });
  const row = await findModel((await params).id);

  let summary: MlModelSummary | null = null;
  if (row.mlModelId) {
    try {
      summary = await mlGetModel(row.mlModelId);
    } catch (error) {
      if (!(error instanceof MlServiceError)) throw error;
    }
  }

  return NextResponse.json({
    model: toModelRow(row),
    featureSchema: summary?.featureSchema ?? [],
    metrics: summary?.metrics ?? null,
  });
});

const patchSchema = z.object({ isActive: z.literal(true) });

export const PATCH = withApi<Params>(async (request, { params }) => {
  const session = await assertApiPermission({ model: ["activate"] });
  patchSchema.parse(await request.json());

  const row = await findModel((await params).id);
  if (row.status !== "READY") {
    throw new ApiError(409, "Only ready models can be activated.", "model_not_ready");
  }

  await prisma.$transaction([
    prisma.mlModel.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    prisma.mlModel.update({ where: { id: row.id }, data: { isActive: true } }),
  ]);

  await recordAudit({
    userId: session.user.id,
    action: "model.activate",
    entity: "MlModel",
    entityId: row.id,
    metadata: { name: row.name, version: row.version },
    request,
  });

  return NextResponse.json({ ok: true });
});

export const DELETE = withApi<Params>(async (request, { params }) => {
  const session = await assertApiPermission({ model: ["delete"] });
  const row = await findModel((await params).id);

  // Models that already produced predictions are archived to keep history intact.
  if (row._count.predictions > 0) {
    await prisma.mlModel.update({ where: { id: row.id }, data: { status: "ARCHIVED", isActive: false } });
    await recordAudit({ userId: session.user.id, action: "model.archive", entity: "MlModel", entityId: row.id, request });
    return NextResponse.json({ result: "archived" });
  }

  await prisma.mlModel.delete({ where: { id: row.id } });

  if (row.mlModelId) {
    try {
      await mlDeleteModel(row.mlModelId);
    } catch (error) {
      if (!(error instanceof MlServiceError) || error.status !== 404) throw error;
    }
  }

  await recordAudit({ userId: session.user.id, action: "model.delete", entity: "MlModel", entityId: row.id, request });
  return NextResponse.json({ result: "deleted" });
});