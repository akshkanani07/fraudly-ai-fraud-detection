import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink } from "better-auth/plugins";

import { clientEnv, serverEnv } from "@/config/env";
import { prisma } from "@/lib/db/prisma";
import { createLogger } from "@/lib/logger/logger";
import {
  sendMagicLinkEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "@/lib/mail/mail-service";

import { ac, DEFAULT_ROLE, ROLES, roles } from "./permissions";

const log = createLogger("auth");

const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 60 * SECONDS_IN_MINUTE;
const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;

/**
 * Emails are dispatched without awaiting the result.
 * This keeps response times identical whether or not an account exists
 * and prevents user enumeration through timing attacks.
 */
function dispatchEmail(label: string, task: Promise<void>): void {
  task.catch((error: unknown) => {
    log.error({ err: error, label }, "Auth email delivery failed");
  });
}

const trustedOrigins = Array.from(
  new Set([serverEnv.BETTER_AUTH_URL, clientEnv.NEXT_PUBLIC_APP_URL]),
);

export const auth = betterAuth({
  appName: clientEnv.NEXT_PUBLIC_APP_NAME,
  baseURL: serverEnv.BETTER_AUTH_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  trustedOrigins,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: SECONDS_IN_HOUR,
    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({ user, url }) => {
      dispatchEmail(
        "reset-password",
        sendResetPasswordEmail({
          to: user.email,
          name: user.name,
          url,
        }),
      );
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: SECONDS_IN_HOUR,

    sendVerificationEmail: async ({ user, url, token }) => {
      dispatchEmail(
        "verify-email",
        sendVerificationEmail({
          to: user.email,
          name: user.name,
          url,
          token,
        }),
      );
    },
  },

  session: {
    expiresIn: 7 * SECONDS_IN_DAY,
    updateAge: SECONDS_IN_DAY,

    cookieCache: {
      enabled: true,
      maxAge: 5 * SECONDS_IN_MINUTE,
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: serverEnv.RATE_LIMIT_MAX_REQUESTS,

    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
      "/sign-in/magic-link": {
        window: 60,
        max: 3,
      },
      "/request-password-reset": {
        window: 60,
        max: 3,
      },
      "/forget-password": {
        window: 60,
        max: 3,
      },
      "/send-verification-email": {
        window: 60,
        max: 3,
      },
    },
  },

  advanced: {
    cookiePrefix: "fraudly",

    useSecureCookies: serverEnv.NODE_ENV === "production",

    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
    },

    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
    },
  },

  plugins: [
    magicLink({
      expiresIn: 5 * SECONDS_IN_MINUTE,

      sendMagicLink: async ({ email, url }) => {
        dispatchEmail(
          "magic-link",
          sendMagicLinkEmail({
            to: email,
            url,
          }),
        );
      },
    }),

    admin({
      ac,
      roles,
      defaultRole: DEFAULT_ROLE,
      adminRoles: [ROLES.ADMIN],
    }),

    // Must be the last plugin
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = typeof auth.$Infer.Session.user;