import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma 7 does not load .env files automatically.
// .env.local takes priority (matches Next.js), then fall back to .env.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});