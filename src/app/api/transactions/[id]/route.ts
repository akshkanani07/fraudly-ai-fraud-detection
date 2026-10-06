import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { logger } from "@/lib/logger/logger";
import { prisma } from "@/lib/db/prisma";
import { updateTransactionSchema } from "@/features/transactions/schemas/transaction.schema";
import { getTransactionById } from "@/features/transactions/services/transaction.service";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/* ============================================================
 * GET /api/transactions/[id]
 * ============================================================ */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const transaction = await getTransactionById(id);

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: transaction });
  } catch (error) {
    logger.error({ error }, "GET /api/transactions/[id] failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ============================================================
 * PATCH /api/transactions/[id]
 * ============================================================ */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const parsed = updateTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TRANSACTION_UPDATED",
        entity: "Transaction",
        entityId: id,
        metadata: parsed.data,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    logger.error({ error }, "PATCH /api/transactions/[id] failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ============================================================
 * DELETE /api/transactions/[id]
 * ============================================================ */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* RBAC — only admin can delete */
    if (session.user.role !== "admin" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden — admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TRANSACTION_DELETED",
        entity: "Transaction",
        entityId: id,
      },
    });

    await prisma.transaction.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "DELETE /api/transactions/[id] failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}