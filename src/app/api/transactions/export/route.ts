import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { logger } from "@/lib/logger/logger";
import { exportSchema } from "@/features/transactions/schemas/transaction.schema";
import {
  listTransactions,
  getTransactionsByIds,
} from "@/features/transactions/services/transaction.service";
import { exportTransactions } from "@/features/transactions/services/export.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
 * POST /api/transactions/export
 * ============================================================ */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = exportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { format, ids, filters } = parsed.data;

    /* Fetch rows */
    let rows;
    if (ids && ids.length > 0) {
      rows = await getTransactionsByIds(ids);
    } else {
      const list = await listTransactions({
        ...(filters ?? {}),
        page: 1,
        pageSize: 1000,
        sort: { field: "transactedAt", direction: "desc" },
      });
      rows = list.data;
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No transactions to export" },
        { status: 400 },
      );
    }

    const { buffer, contentType, extension } = await exportTransactions(
      rows,
      format,
    );

    const filename = `transactions-${Date.now()}.${extension}`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    logger.error({ error }, "POST /api/transactions/export failed");
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 },
    );
  }
}