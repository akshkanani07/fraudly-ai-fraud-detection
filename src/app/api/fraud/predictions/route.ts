import { NextResponse } from "next/server";

import { predictionsQuerySchema } from "@/features/fraud-detection/schemas/fraud.schemas";
import { withApi } from "@/features/fraud-detection/server/api-utils";
import type { Algorithm, FraudFactor, PredictionHistoryItem, RiskLevel } from "@/features/fraud-detection/types";
import { Prisma } from "@/generated/prisma/client";
import { assertApiPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

interface StoredExplanation {
  factors?: FraudFactor[];
  missingFeatures?: string[];
  threshold?: number;
}

export const GET = withApi(async (request) => {
  await assertApiPermission({ prediction: ["read"] });
  const query = predictionsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  const where: Prisma.PredictionWhereInput = {
    ...(query.risk ? { riskLevel: query.risk } : {}),
    ...(query.verdict ? { isFraud: query.verdict === "fraud" } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.prediction.count({ where }),
    prisma.prediction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        transaction: {
          select: { id: true, amount: true, currency: true, merchant: true, category: true, country: true, status: true },
        },
        model: { select: { id: true, name: true, algorithm: true } },
      },
    }),
  ]);

  const items: PredictionHistoryItem[] = rows.map((row) => {
    const explanation = (row.explanation ?? {}) as StoredExplanation;
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      isFraud: row.isFraud,
      fraudProbability: row.fraudProbability,
      confidence: row.confidence,
      riskLevel: row.riskLevel as RiskLevel,
      latencyMs: row.latencyMs,
      threshold: explanation.threshold ?? null,
      factors: explanation.factors ?? [],
      missingFeatures: explanation.missingFeatures ?? [],
      transaction: {
        id: row.transaction.id,
        amount: Number(row.transaction.amount),
        currency: row.transaction.currency,
        merchant: row.transaction.merchant,
        category: row.transaction.category,
        country: row.transaction.country,
        status: row.transaction.status,
      },
      model: { id: row.model.id, name: row.model.name, algorithm: row.model.algorithm as Algorithm },
    };
  });

  return NextResponse.json({ items, total, page: query.page, pageSize: query.pageSize });
});