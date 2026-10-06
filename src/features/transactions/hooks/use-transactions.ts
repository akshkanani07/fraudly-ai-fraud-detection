"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { fetchTransactions } from "@/features/transactions/services/transaction.api";
import { transactionKeys } from "@/features/transactions/services/query-keys";
import type { TransactionListParams } from "@/features/transactions/types";

interface UseTransactionsOptions {
  params: TransactionListParams;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
}

export function useTransactions({
  params,
  enabled = true,
  staleTime = 30 * 1000,
  refetchInterval = false,
}: UseTransactionsOptions) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => fetchTransactions(params),
    enabled,
    staleTime,
    refetchInterval,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}