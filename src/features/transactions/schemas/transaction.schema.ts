import { z } from "zod";

/* ============================================================
 * Enums (Mirror Prisma — Zod Native Enums)
 * ============================================================ */
export const transactionStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "FLAGGED",
  "BLOCKED",
]);

export const transactionChannelEnum = z.enum([
  "ONLINE",
  "POS",
  "ATM",
  "MOBILE",
  "TRANSFER",
]);

export const riskLevelEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const sortFieldEnum = z.enum([
  "transactedAt",
  "amount",
  "riskLevel",
  "createdAt",
  "status",
]);

export const sortDirectionEnum = z.enum(["asc", "desc"]);

/* ============================================================
 * List Query Schema (URL Params)
 * ============================================================ */
export const transactionListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),

  status: z
    .string()
    .transform((val) => val.split(",").filter(Boolean))
    .pipe(z.array(transactionStatusEnum))
    .optional(),

  channel: z
    .string()
    .transform((val) => val.split(",").filter(Boolean))
    .pipe(z.array(transactionChannelEnum))
    .optional(),

  riskLevel: z
    .string()
    .transform((val) => val.split(",").filter(Boolean))
    .pipe(z.array(riskLevelEnum))
    .optional(),

  isFraud: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),

  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),

  amountMin: z.coerce.number().min(0).optional(),
  amountMax: z.coerce.number().min(0).optional(),

  merchant: z.string().trim().max(200).optional(),
  country: z.string().trim().length(2).toUpperCase().optional(),

  sortField: sortFieldEnum.default("transactedAt"),
  sortDirection: sortDirectionEnum.default("desc"),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;

/* ============================================================
 * Bulk Action Schema
 * ============================================================ */
export const bulkActionSchema = z
  .object({
    action: z.enum([
      "UPDATE_STATUS",
      "DELETE",
      "MARK_FRAUD",
      "MARK_LEGITIMATE",
    ]),
    ids: z
      .array(z.string().min(1))
      .min(1, "At least one transaction is required")
      .max(500, "Cannot process more than 500 at once"),
    status: transactionStatusEnum.optional(),
  })
  .refine(
    (data) =>
      data.action !== "UPDATE_STATUS" || data.status !== undefined,
    {
      message: "Status is required when action is UPDATE_STATUS",
      path: ["status"],
    },
  );

export type BulkActionInput = z.infer<typeof bulkActionSchema>;

/* ============================================================
 * Export Schema
 * ============================================================ */
export const exportSchema = z.object({
  format: z.enum(["csv", "xlsx", "pdf"]),
  ids: z.array(z.string().min(1)).max(1000).optional(),
  filters: z
    .object({
      search: z.string().optional(),
      status: z.array(transactionStatusEnum).optional(),
      channel: z.array(transactionChannelEnum).optional(),
      riskLevel: z.array(riskLevelEnum).optional(),
      isFraud: z.boolean().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      amountMin: z.number().min(0).optional(),
      amountMax: z.number().min(0).optional(),
    })
    .optional(),
});

export type ExportInput = z.infer<typeof exportSchema>;

/* ============================================================
 * Single Transaction Update (Inline Edit)
 * ============================================================ */
export const updateTransactionSchema = z.object({
  status: transactionStatusEnum.optional(),
  merchant: z.string().trim().max(200).nullable().optional(),
  category: z.string().trim().max(100).nullable().optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;