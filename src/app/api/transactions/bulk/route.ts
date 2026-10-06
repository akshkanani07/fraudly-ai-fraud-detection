import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { logger } from "@/lib/logger/logger";
import { bulkActionSchema } from "@/features/transactions/schemas/transaction.schema";
import { bulkAction } from "@/features/transactions/services/transaction.service";

export const runtime = "nodejs";

/* ============================================================
 * POST /api/transactions/bulk
 * ============================================================ */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bulkActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    /* RBAC — DELETE only for admin */
    if (
      parsed.data.action === "DELETE" &&
      session.user.role !== "admin" &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Forbidden — admin access required" },
        { status: 403 },
      );
    }

    const result = await bulkAction(parsed.data, session.user.id);

    return NextResponse.json({
      success: true,
      affected: result.affected,
      message: `${result.affected} transaction(s) ${parsed.data.action.toLowerCase().replace("_", " ")}.`,
    });
  } catch (error) {
    logger.error({ error }, "POST /api/transactions/bulk failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}