import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { mlPredict } from "@/lib/ml/ml-client";

import type { FeatureValue, PredictionResult, RiskLevel } from "../types";
import { ApiError } from "./api-utils";

const CHANNELS = ["ONLINE", "POS", "ATM", "MOBILE", "TRANSFER"] as const;
type Channel = (typeof CHANNELS)[number];

const MAX_AMOUNT = 999_999_999_999;

function normaliseKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Finds the first feature whose normalised name matches one of the aliases. */
function pick(features: Record<string, FeatureValue>, aliases: string[]): FeatureValue {
  for (const [key, value] of Object.entries(features)) {
    if (aliases.includes(normaliseKey(key)) && value !== null && value !== "") return value;
  }
  return null;
}

function text(value: FeatureValue, max: number): string | null {
  return value === null ? null : String(value).trim().slice(0, max) || null;
}

function deriveTransaction(features: Record<string, FeatureValue>) {
  const amountValue = Number(pick(features, ["amount", "transactionamount", "amt"]));
  const amount = Number.isFinite(amountValue) ? Math.min(Math.abs(amountValue), MAX_AMOUNT) : 0;

  const channelValue = text(pick(features, ["channel"]), 20)?.toUpperCase();
  const channel: Channel = CHANNELS.find((item) => item === channelValue) ?? "ONLINE";

  const country = text(pick(features, ["country", "countrycode"]), 2)?.toUpperCase() ?? null;
  const currency = text(pick(features, ["currency"]), 3)?.toUpperCase();

  return {
    amount: Math.round(amount * 100) / 100,
    currency: currency && currency.length === 3 ? currency : "USD",
    merchant: text(pick(features, ["merchant", "merchantname"]), 120),
    category: text(pick(features, ["category", "merchantcategory"]), 80),
    channel,
    customerId: text(pick(features, ["customerid", "customer", "accountid"]), 100),
    deviceId: text(pick(features, ["deviceid"]), 100),
    ipAddress: text(pick(features, ["ipaddress", "ip"]), 64),
    country: country && country.length === 2 ? country : null,
  };
}

function transactionStatus(isFraud: boolean, risk: RiskLevel) {
  if (isFraud && risk === "CRITICAL") return "BLOCKED" as const;
  if (isFraud) return "FLAGGED" as const;
  if (risk === "MEDIUM") return "PENDING" as const;
  return "APPROVED" as const;
}

export async function runPrediction(params: {
  userId: string;
  modelId?: string;
  features: Record<string, FeatureValue>;
  explain: boolean;
}): Promise<PredictionResult> {
  const model = params.modelId
    ? await prisma.mlModel.findUnique({ where: { id: params.modelId } })
    : await prisma.mlModel.findFirst({ where: { isActive: true, status: "READY" } });

  if (!model) {
    throw new ApiError(409, "No active model found. Train a model and set it as active first.", "no_active_model");
  }
  if (model.status !== "READY" || !model.mlModelId) {
    throw new ApiError(409, "This model is not ready for predictions.", "model_not_ready");
  }

  const ml = await mlPredict({ modelId: model.mlModelId, features: params.features, explain: params.explain });
  const status = transactionStatus(ml.isFraud, ml.riskLevel);

  const created = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        ...deriveTransaction(params.features),
        features: params.features as Prisma.InputJsonValue,
        status,
        createdById: params.userId,
      },
    });

    const prediction = await tx.prediction.create({
      data: {
        transactionId: transaction.id,
        modelId: model.id,
        isFraud: ml.isFraud,
        fraudProbability: ml.fraudProbability,
        confidence: ml.confidence,
        riskLevel: ml.riskLevel,
        latencyMs: Math.round(ml.latencyMs),
        requestedById: params.userId,
        explanation: {
          factors: ml.factors,
          missingFeatures: ml.missingFeatures,
          threshold: ml.threshold,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    if (ml.isFraud) {
      await tx.notification.create({
        data: {
          userId: params.userId,
          type: "FRAUD_ALERT",
          title: ml.riskLevel === "CRITICAL" ? "Critical fraud alert" : "Fraud alert",
          message: `A transaction was flagged with a ${(ml.fraudProbability * 100).toFixed(1)}% fraud probability.`,
          data: { predictionId: prediction.id, transactionId: transaction.id } as Prisma.InputJsonValue,
        },
      });
    }

    return { transaction, prediction };
  });

  return {
    predictionId: created.prediction.id,
    transactionId: created.transaction.id,
    modelName: model.name,
    transactionStatus: status,
    isFraud: ml.isFraud,
    fraudProbability: ml.fraudProbability,
    confidence: ml.confidence,
    riskLevel: ml.riskLevel,
    threshold: ml.threshold,
    factors: ml.factors,
    missingFeatures: ml.missingFeatures,
    latencyMs: ml.latencyMs,
    predictedAt: created.prediction.createdAt.toISOString(),
  };
}