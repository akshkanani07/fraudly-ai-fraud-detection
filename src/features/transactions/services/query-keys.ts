import type { TransactionListParams } from "@/features/transactions/types";

/* ============================================================
 * Query Keys Factory
 * ============================================================ */
export const transactionKeys = {
  all: ["transactions"] as const,

  lists: () => [...transactionKeys.all, "list"] as const,

  list: (params: TransactionListParams) =>
    [...transactionKeys.lists(), params] as const,

  details: () => [...transactionKeys.all, "detail"] as const,

  detail: (id: string) => [...transactionKeys.details(), id] as const,

  stats: () => [...transactionKeys.all, "stats"] as const,

  statsWithFilters: (filters: Partial<TransactionListParams>) =>
    [...transactionKeys.stats(), filters] as const,
};

export type TransactionKeys = typeof transactionKeys;