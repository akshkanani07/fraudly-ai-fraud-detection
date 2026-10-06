import { z } from "zod";

/**
 * Centralised, type-safe environment configuration.
 *
 * - `serverEnv`: server-only variables (secrets). Accessing it in the browser throws.
 * - `clientEnv`: NEXT_PUBLIC_* variables, safe for the browser.
 *
 * Set SKIP_ENV_VALIDATION=1 to skip validation (e.g. Docker image builds, CI).
 */

const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().min(1).optional(),
);

const optionalEmail = z.preprocess(emptyToUndefined, z.email().optional());

const serverSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required")
      .refine(
        (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
        "DATABASE_URL must be a PostgreSQL connection string",
      ),

    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: z.url(),

    MAILJET_API_KEY: optionalString,
    MAILJET_SECRET_KEY: optionalString,
    MAIL_FROM_EMAIL: optionalEmail,
    MAIL_FROM_NAME: z.string().min(1).default("Fraudly"),

    REDIS_URL: z
      .string()
      .min(1, "REDIS_URL is required")
      .refine(
        (value) => value.startsWith("redis://") || value.startsWith("rediss://"),
        "REDIS_URL must start with redis:// or rediss://",
      ),

    CLOUDINARY_CLOUD_NAME: optionalString,
    CLOUDINARY_API_KEY: optionalString,
    CLOUDINARY_API_SECRET: optionalString,

    ML_API_URL: z.url(),
    ML_API_KEY: z.string().min(32, "ML_API_KEY must be at least 32 characters"),

    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
    RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== "production") return;

    const requiredInProduction = [
      "MAILJET_API_KEY",
      "MAILJET_SECRET_KEY",
      "MAIL_FROM_EMAIL",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ] as const;

    for (const key of requiredInProduction) {
      if (!data[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required in production`,
        });
      }
    }
  });

const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Fraudly"),
  NEXT_PUBLIC_APP_URL: z.url(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

const isServer = typeof window === "undefined";
const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "1" ||
  process.env.SKIP_ENV_VALIDATION === "true";

function parseEnv<T extends z.ZodType>(
  schema: T,
  source: Record<string, unknown>,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(source);

  if (!result.success) {
    throw new Error(
      `Invalid ${label} environment variables:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}

// NEXT_PUBLIC_* variables must be referenced statically so Next.js can inline them.
const clientSource = {
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

export const clientEnv: ClientEnv = skipValidation
  ? (clientSource as unknown as ClientEnv)
  : parseEnv(clientSchema, clientSource, "client");

function loadServerEnv(): ServerEnv {
  if (skipValidation) {
    return process.env as unknown as ServerEnv;
  }

  return parseEnv(serverSchema, process.env, "server");
}

export const serverEnv: ServerEnv = isServer
  ? loadServerEnv()
  : (new Proxy({} as ServerEnv, {
      get(_target, property) {
        throw new Error(
          `serverEnv.${String(property)} cannot be accessed in the browser. Use clientEnv instead.`,
        );
      },
    }) as ServerEnv);

export const isProduction = process.env.NODE_ENV === "production";
export const isDevelopment = process.env.NODE_ENV === "development";
export const isTest = process.env.NODE_ENV === "test";