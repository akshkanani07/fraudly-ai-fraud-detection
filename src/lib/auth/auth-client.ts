"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

/* ============================================================
 * Auth Client Instance
 * ============================================================ */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [magicLinkClient()],
});

/* ============================================================
 * Direct Methods
 * ============================================================ */
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,

  // Email verification
  sendVerificationEmail,

  // Password reset (Better Auth v1.x નામ)
  requestPasswordReset,
  resetPassword,
} = authClient;

// Better Auth exposes magic-link sign-in as a nested signIn method.
export const signInWithMagicLink = authClient.signIn.magicLink;

/* ============================================================
 * Aliases (Backwards Compatible — જૂનાં નામ)
 * ============================================================ */
/**
 * `forgetPassword` alias for `requestPasswordReset`
 *
 * Better Auth v1.x માં Function નામ `requestPasswordReset` છે.
 * ઘણી Docs/Tutorials માં `forgetPassword` તરીકે લખેલું મળે —
 * એટલે Alias રાખ્યું છે, જેથી બંને નામ કામ કરે.
 */
export const forgetPassword = requestPasswordReset;

/* ============================================================
 * Types
 * ============================================================ */
export type AuthClient = typeof authClient;
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;