import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic route protection (cookie presence only, no database access).
 * Real authorization happens in Server Components / Actions / API routes via
 * "@/lib/auth/session".
 *
 * COOKIE_PREFIX must match `advanced.cookiePrefix` in src/lib/auth/auth.ts.
 */
const COOKIE_PREFIX = "fraudly";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/fraud-detection",
  "/datasets",
  "/models",
  "/analytics",
  "/reports",
  "/notifications",
  "/users",
  "/audit-logs",
  "/settings",
] as const;

/** Pages only for signed-out visitors. Signed-in users are sent to the dashboard. */
const GUEST_ONLY_PATHS = [
  "/login",
  "/register",
  "/magic-link",
  "/forgot-password",
] as const;

function matchesPath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request, { cookiePrefix: COOKIE_PREFIX }));

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(hasSession ? "/dashboard" : "/login", request.url),
    );
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => matchesPath(pathname, prefix));

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackURL", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const isGuestOnly = GUEST_ONLY_PATHS.some((path) => matchesPath(pathname, path));

  if (isGuestOnly && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};