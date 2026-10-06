import { NextResponse } from "next/server";

import { modelInclude, syncModelsFromMl, toModelRow } from "@/features/fraud-detection/server/model-sync";
import { withApi } from "@/features/fraud-detection/server/api-utils";
import { assertApiPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { MlServiceError } from "@/lib/ml/ml-client";

export const runtime = "nodejs";

export const GET = withApi(async () => {
  const session = await assertApiPermission({ model: ["read"] });

  let mlOnline = true;
  try {
    await syncModelsFromMl(session.user.id);
  } catch (error) {
    if (!(error instanceof MlServiceError)) throw error;
    mlOnline = false;
  }

  const rows = await prisma.mlModel.findMany({
    orderBy: { createdAt: "desc" },
    include: modelInclude,
  });

  return NextResponse.json({ models: rows.map(toModelRow), mlOnline });
});