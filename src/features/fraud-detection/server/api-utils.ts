import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { AuthorizationError } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createLogger } from "@/lib/logger/logger";
import { MlServiceError } from "@/lib/ml/ml-client";

const log = createLogger("fraud-api");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, message: string, code = "error") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function errorResponse(status: number, message: string, code: string): NextResponse {
  return NextResponse.json({ error: { message, code } }, { status });
}

function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthorizationError) {
    return errorResponse(error.status, error.message, error.status === 401 ? "unauthorized" : "forbidden");
  }
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.message, error.code);
  }
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const path = issue?.path.join(".");
    return errorResponse(422, path ? `${path}: ${issue?.message}` : (issue?.message ?? "Invalid request"), "validation_error");
  }
  if (error instanceof MlServiceError) {
    return errorResponse(error.status >= 500 ? 502 : error.status, error.message, error.code);
  }

  log.error({ err: error }, "Unhandled API error");
  return errorResponse(500, "An unexpected error occurred", "internal_error");
}

type RouteContext<P> = { params: Promise<P> };

/** Wraps a route handler so every failure becomes a consistent JSON error. */
export function withApi<P extends Record<string, string> = Record<string, string>>(
  handler: (request: NextRequest, context: RouteContext<P>) => Promise<Response>,
) {
  return async (request: NextRequest, context: RouteContext<P>): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export async function recordAudit(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: params.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: params.request?.headers.get("user-agent") ?? null,
      },
    });
  } catch (error) {
    log.warn({ err: error, action: params.action }, "Failed to write audit log");
  }
}