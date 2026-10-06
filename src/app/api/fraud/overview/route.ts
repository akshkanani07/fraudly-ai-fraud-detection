import { NextResponse } from "next/server";

import { withApi } from "@/features/fraud-detection/server/api-utils";
import { RISK_LEVELS, type Algorithm, type FraudOverview } from "@/features/fraud-detection/types";
import { assertApiPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { mlHealth } from "@/lib/ml/ml-client";

export const runtime = "nodejs";

const DAYS = 14;

export const GET = withApi(async () => {
  await assertApiPermission({ prediction: ["read"] });

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (DAYS - 1)));

  const [total, fraud, latency, risks, daily, active, mlOnline] = await Promise.all([
    prisma.prediction.count(),
    prisma.prediction.count({ where: { isFraud: true } }),
    prisma.prediction.aggregate({ _avg: { latencyMs: true } }),
    prisma.prediction.groupBy({ by: ["riskLevel"], _count: { _all: true } }),
    prisma.$queryRaw<{ day: Date; total: number; fraud: number }[]>`
      SELECT date_trunc('day', "createdAt") AS day,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE "isFraud")::int AS fraud
      FROM predictions
      WHERE "createdAt" >= ${start}
      GROUP BY 1
      ORDER BY 1`,
    prisma.mlModel.findFirst({ where: { isActive: true, status: "READY" } }),
    mlHealth(),
  ]);

  const byDay = new Map(daily.map((row) => [row.day.toISOString().slice(0, 10), row]));
  const timeline = Array.from({ length: DAYS }, (_, index) => {
    const date = new Date(start.getTime() + index * 86_400_000).toISOString().slice(0, 10);
    const row = byDay.get(date);
    return { date, total: row?.total ?? 0, fraud: row?.fraud ?? 0 };
  });

  const riskCounts = new Map(risks.map((row) => [row.riskLevel, row._count._all]));

  const overview: FraudOverview = {
    totalPredictions: total,
    fraudPredictions: fraud,
    fraudRate: total > 0 ? fraud / total : 0,
    avgLatencyMs: latency._avg.latencyMs ?? 0,
    riskDistribution: RISK_LEVELS.map((level) => ({ level, count: riskCounts.get(level) ?? 0 })),
    timeline,
    activeModel: active
      ? {
          id: active.id,
          name: active.name,
          algorithm: active.algorithm as Algorithm,
          f1Score: active.f1Score,
          precision: active.precision,
          recall: active.recall,
          rocAuc: active.rocAuc,
        }
      : null,
    mlOnline,
  };

  return NextResponse.json(overview);
});