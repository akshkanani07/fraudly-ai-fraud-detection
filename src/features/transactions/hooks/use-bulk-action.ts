"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  runBulkAction,
  exportTransactionsFile,
} from "@/features/transactions/services/transaction.api";
import { transactionKeys } from "@/features/transactions/services/query-keys";
import type {
  BulkActionPayload,
  ExportRequest,
} from "@/features/transactions/types";

/* ============================================================
 * Bulk Action
 * ============================================================ */
export function useBulkAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkActionPayload) => runBulkAction(payload),

    onSuccess: (data) => {
      toast.success(data.message ?? "Bulk action completed");

      queryClient.invalidateQueries({
        queryKey: transactionKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: transactionKeys.stats(),
      });
    },

    onError: () => {
      toast.error("Bulk action failed");
    },
  });
}

/* ============================================================
 * Export
 * ============================================================ */
export function useExportTransactions() {
  return useMutation({
    mutationFn: (payload: ExportRequest) => exportTransactionsFile(payload),

    onMutate: (payload) => {
      toast.loading(`Preparing ${payload.format.toUpperCase()} export...`, {
        id: "export-toast",
      });
    },

    onSuccess: (_data, payload) => {
      toast.success(`${payload.format.toUpperCase()} downloaded`, {
        id: "export-toast",
      });
    },

    onError: (_error, payload) => {
      toast.error(`Failed to export ${payload.format.toUpperCase()}`, {
        id: "export-toast",
      });
    },
  });
}