import { NextResponse } from "next/server";

import { withApi } from "@/features/fraud-detection/server/api-utils";
import { syncModelsFromMl } from "@/features/fraud-detection/server/model-sync";
import { assertApiPermission } from "@/lib/auth/session";
import { mlGetJob } from "@/lib/ml/ml-client";

export const runtime = "nodejs";

export const GET = withApi<{ jobId: string }>(async (_request, { params }) => {
  const session = await assertApiPermission({ model: ["read"] });
  const job = await mlGetJob((await params).jobId);

  if (job.status === "COMPLETED") {
    await syncModelsFromMl(session.user.id);
  }

  return NextResponse.json(job);
});