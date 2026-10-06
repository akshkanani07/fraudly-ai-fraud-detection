import pino, { type Logger } from "pino";

import { serverEnv } from "@/config/env";

/**
 * Application-wide structured logger (Pino).
 *
 * - Sensitive fields are redacted automatically.
 * - Use createLogger("module-name") to get a child logger that tags every entry.
 * - Output is always JSON; for readable logs in development run:
 *     npm run dev 2>&1 | npx pino-pretty
 */

const REDACTED_PATHS = [
  "password",
  "newPassword",
  "currentPassword",
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "secret",
  "apiKey",
  "authorization",
  "cookie",
  "*.password",
  "*.newPassword",
  "*.currentPassword",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.idToken",
  "*.secret",
  "*.apiKey",
  "*.authorization",
  "*.cookie",
  "headers.authorization",
  "headers.cookie",
  "req.headers.authorization",
  "req.headers.cookie",
];

export const logger: Logger = pino({
  level: serverEnv.LOG_LEVEL,
  base: { service: "fraudly", env: serverEnv.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: REDACTED_PATHS,
    censor: "[REDACTED]",
  },
});

export function createLogger(module: string): Logger {
  return logger.child({ module });
}