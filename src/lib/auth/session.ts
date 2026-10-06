import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, type Session } from "./auth";
import {
  roleHasPermission,
  type AppRole,
  type Permissions,
} from "./permissions";

/**
 * Server-side session helpers.
 * - Pages / layouts / Server Actions: requireSession, requirePermission, requireRole (they redirect).
 * - API route handlers: assertApiPermission (it throws AuthorizationError with an HTTP status).
 */

/** Cached per request, so calling it many times costs one lookup. */
export const getServerSession = cache(async (): Promise<Session | null> => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireSession(): Promise<Session> {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requirePermission(permissions: Permissions): Promise<Session> {
  const session = await requireSession();

  if (!roleHasPermission(session.user.role, permissions)) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireRole(...allowedRoles: AppRole[]): Promise<Session> {
  const session = await requireSession();

  const userRoles = (session.user.role ?? "")
    .split(",")
    .map((role) => role.trim());

  if (!allowedRoles.some((role) => userRoles.includes(role))) {
    redirect("/dashboard");
  }

  return session;
}

export class AuthorizationError extends Error {
  readonly status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

/**
 * For API route handlers. Throws AuthorizationError (401 not signed in,
 * 403 missing permission) which the API error handler converts to a response.
 */
export async function assertApiPermission(
  permissions?: Permissions,
): Promise<Session> {
  const session = await getServerSession();

  if (!session) {
    throw new AuthorizationError(401, "Authentication required");
  }

  if (permissions && !roleHasPermission(session.user.role, permissions)) {
    throw new AuthorizationError(403, "You do not have permission to perform this action");
  }

  return session;
}