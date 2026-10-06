"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  fetchTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/features/transactions/services/transaction.api";
import { transactionKeys } from "@/features/transactions/services/query-keys";

/* ============================================================
 * Get Single Transaction
 * ============================================================ */
export function useTransaction(id: string | null) {
  return useQuery({
    queryKey: transactionKeys.detail(id ?? ""),
    queryFn: () => fetchTransaction(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/* ============================================================
 * Update Transaction
 * ============================================================ */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { status?: string; merchant?: string | null; category?: string | null };
    }) => updateTransaction(id, payload),

    onSuccess: (data) => {
      toast.success("Transaction updated");

      /* Invalidate detail */
      queryClient.invalidateQueries({
        queryKey: transactionKeys.detail(data.id),
      });

      /* Invalidate lists */
      queryClient.invalidateQueries({
        queryKey: transactionKeys.lists(),
      });

      /* Invalidate stats */
      queryClient.invalidateQueries({
        queryKey: transactionKeys.stats(),
      });
    },

    onError: () => {
      toast.error("Failed to update transaction");
    },
  });
}

/* ============================================================
 * Delete Transaction
 * ============================================================ */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),

    onSuccess: () => {
      toast.success("Transaction deleted");

      queryClient.invalidateQueries({
        queryKey: transactionKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: transactionKeys.stats(),
      });
    },

    onError: () => {
      toast.error("Failed to delete transaction");
    },
  });
}