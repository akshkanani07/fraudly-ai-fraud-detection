import "server-only";

import type { Prisma, TransactionStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger/logger";

import type {
  TransactionFilters,
  TransactionListParams,
  TransactionListResponse,
  TransactionRow,
  TransactionStats,
} from "@/features/transactions/types";

type BulkActionInput = {
  action: "UPDATE_STATUS" | "MARK_FRAUD" | "MARK_LEGITIMATE" | "DELETE";
  ids: string[];
  status?: TransactionStatus;
};

/* ============================================================
 * Build Prisma Where Clause
 * ============================================================ */
export function buildTransactionWhere(
  filters: TransactionFilters,
): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {};

  /* Search — merchant, externalId, customerId, category */
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { externalId: { contains: q, mode: "insensitive" } },
      { merchant: { contains: q, mode: "insensitive" } },
      { customerId: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.status?.length) {
    where.status = { in: filters.status };
  }

  if (filters.channel?.length) {
    where.channel = { in: filters.channel };
  }

  if (filters.isFraud !== undefined) {
    where.isFraudLabel = filters.isFraud;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.transactedAt = {};
    if (filters.dateFrom) {
      where.transactedAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.transactedAt.lte = new Date(filters.dateTo);
    }
  }

  if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
    where.amount = {};
    if (filters.amountMin !== undefined) {
      where.amount.gte = filters.amountMin;
    }
    if (filters.amountMax !== undefined) {
      where.amount.lte = filters.amountMax;
    }
  }

  if (filters.merchant) {
    where.merchant = { contains: filters.merchant, mode: "insensitive" };
  }

  if (filters.country) {
    where.country = filters.country.toUpperCase();
  }

  /* Risk Level — filter via Predictions */
  if (filters.riskLevel?.length) {
    where.predictions = {
      some: {
        riskLevel: { in: filters.riskLevel },
      },
    };
  }

  return where;
}

/* ============================================================
 * Build Order By
 * ============================================================ */
function buildOrderBy(
  field: TransactionListParams["sort"] extends infer S
    ? S extends { field: infer F }
      ? F
      : never
    : never,
  direction: "asc" | "desc",
): Prisma.TransactionOrderByWithRelationInput {
  if (field === "riskLevel") {
    /* Risk Level is on Prediction — sort by fraudProbability as proxy */
    return {
      predictions: {
        _count: direction,
      },
    };
  }

  return { [field]: direction } as Prisma.TransactionOrderByWithRelationInput;
}

/* ============================================================
 * Map Prisma Result to Row
 * ============================================================ */
function mapToRow(
  tx: Awaited<ReturnType<typeof prisma.transaction.findFirst>> & {
    predictions?: Array<{
      isFraud: boolean;
      fraudProbability: number;
      confidence: number;
      riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      createdAt: Date;
      model: { name: string; version: number };
    }>;
  },
): TransactionRow {
  const latest = tx?.predictions?.[0];

  return {
    id: tx!.id,
    externalId: tx!.externalId,
    amount: Number(tx!.amount),
    currency: tx!.currency,
    merchant: tx!.merchant,
    category: tx!.category,
    channel: tx!.channel,
    customerId: tx!.customerId,
    country: tx!.country,
    status: tx!.status,
    isFraudLabel: tx!.isFraudLabel,
    transactedAt: tx!.transactedAt.toISOString(),
    createdAt: tx!.createdAt.toISOString(),

    riskLevel: latest?.riskLevel ?? null,
    riskScore: latest?.fraudProbability ?? null,
    isFraud: latest?.isFraud ?? null,
    confidence: latest?.confidence ?? null,
    modelName: latest?.model.name ?? null,
    modelVersion: latest?.model.version ?? null,
  };
}

/* ============================================================
 * List Transactions
 * ============================================================ */
export async function listTransactions(
  params: TransactionListParams,
): Promise<TransactionListResponse> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = buildTransactionWhere(params);
  const sort = params.sort ?? { field: "transactedAt", direction: "desc" };
  const orderBy = buildOrderBy(sort.field, sort.direction);

  try {
    const [rows, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          predictions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              model: {
                select: { name: true, version: true },
              },
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data: rows.map(mapToRow),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error({ error, params }, "Failed to list transactions");
    throw new Error("Failed to fetch transactions");
  }
}

/* ============================================================
 * Get Single Transaction (Full Detail)
 * ============================================================ */
export async function getTransactionById(id: string) {
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        dataset: {
          select: { id: true, name: true },
        },
        predictions: {
          orderBy: { createdAt: "desc" },
          include: {
            model: {
              select: { id: true, name: true, version: true, algorithm: true },
            },
            requestedBy: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return tx;
  } catch (error) {
    logger.error({ error, id }, "Failed to fetch transaction");
    throw new Error("Failed to fetch transaction");
  }
}

/* ============================================================
 * Get Transactions by IDs (for Export)
 * ============================================================ */
export async function getTransactionsByIds(
  ids: string[],
): Promise<TransactionRow[]> {
  if (ids.length === 0) return [];

  const rows = await prisma.transaction.findMany({
    where: { id: { in: ids } },
    orderBy: { transactedAt: "desc" },
    include: {
      predictions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          model: { select: { name: true, version: true } },
        },
      },
    },
  });

  return rows.map(mapToRow);
}

/* ============================================================
 * Stats for Header Cards
 * ============================================================ */
export async function getTransactionStats(
  filters: TransactionFilters = {},
): Promise<TransactionStats> {
  const where = buildTransactionWhere(filters);

  const [
    total,
    pending,
    approved,
    flagged,
    blocked,
    fraud,
    aggregate,
  ] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.count({ where: { ...where, status: "PENDING" } }),
    prisma.transaction.count({ where: { ...where, status: "APPROVED" } }),
    prisma.transaction.count({ where: { ...where, status: "FLAGGED" } }),
    prisma.transaction.count({ where: { ...where, status: "BLOCKED" } }),
    prisma.transaction.count({ where: { ...where, isFraudLabel: true } }),
    prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _avg: { amount: true },
    }),
  ]);

  const totalAmount = Number(aggregate._sum.amount ?? 0);
  const avgAmount = Number(aggregate._avg.amount ?? 0);
  const legitimate = total - fraud;

  return {
    total,
    pending,
    approved,
    flagged,
    blocked,
    fraud,
    legitimate,
    fraudRate: total > 0 ? (fraud / total) * 100 : 0,
    totalAmount,
    avgAmount,
  };
}

/* ============================================================
 * Bulk Action
 * ============================================================ */
export async function bulkAction(
  input: BulkActionInput,
  userId: string,
): Promise<{ affected: number }> {
  const { action, ids, status } = input;

  try {
    switch (action) {
      case "UPDATE_STATUS": {
        const result = await prisma.transaction.updateMany({
          where: { id: { in: ids } },
          data: { status: status! },
        });
        return { affected: result.count };
      }

      case "MARK_FRAUD": {
        const result = await prisma.transaction.updateMany({
          where: { id: { in: ids } },
          data: { isFraudLabel: true, status: "FLAGGED" },
        });
        return { affected: result.count };
      }

      case "MARK_LEGITIMATE": {
        const result = await prisma.transaction.updateMany({
          where: { id: { in: ids } },
          data: { isFraudLabel: false, status: "APPROVED" },
        });
        return { affected: result.count };
      }

      case "DELETE": {
        /* Audit log before delete */
        await prisma.auditLog.createMany({
          data: ids.map((id) => ({
            userId,
            action: "TRANSACTION_DELETED",
            entity: "Transaction",
            entityId: id,
          })),
        });

        const result = await prisma.transaction.deleteMany({
          where: { id: { in: ids } },
        });
        return { affected: result.count };
      }

      default:
        throw new Error("Unknown bulk action");
    }
  } catch (error) {
    logger.error({ error, input, userId }, "Bulk action failed");
    throw new Error("Bulk action failed");
  }
}