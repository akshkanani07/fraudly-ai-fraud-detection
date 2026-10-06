import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { logger } from "@/lib/logger/logger";
import { transactionListQuerySchema } from "@/features/transactions/schemas/transaction.schema";
import {
  listTransactions,
  getTransactionStats,
} from "@/features/transactions/services/transaction.service";
import type { TransactionListParams } from "@/features/transactions/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
 * GET /api/transactions
 * ============================================================ */
export async function GET(req: NextRequest) {
  try {
    /* ---- Auth ---- */
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    /* ---- Parse Query ---- */
    const { searchParams } = new URL(req.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const parsed = transactionListQuerySchema.safeParse(rawQuery);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      sortField,
      sortDirection,
      page,
      pageSize,
      ...filters
    } = parsed.data;

    const params: TransactionListParams = {
      ...filters,
      page,
      pageSize,
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    };

    /* ---- Fetch ---- */
    const [list, stats] = await Promise.all([
      listTransactions(params),
      getTransactionStats(filters),
    ]);

    return NextResponse.json({
      ...list,
      stats,
    });
  } catch (error) {
    logger.error({ error }, "GET /api/transactions failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}