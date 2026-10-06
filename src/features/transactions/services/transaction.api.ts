import axios, { type AxiosInstance } from "axios";
import { toast } from "sonner";

import type {
  TransactionListParams,
  TransactionListResponse,
  TransactionStats,
  TransactionWithRelations,
  BulkActionPayload,
  BulkActionResponse,
  ExportRequest,
} from "@/features/transactions/types";

/* ============================================================
 * Axios Instance
 * ============================================================ */
export const apiClient: AxiosInstance = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

/* ============================================================
 * Error Interceptor
 * ============================================================ */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ??
      error?.message ??
      "Something went wrong";

    /* Toast only for non-401 (401 = redirect to login handled elsewhere) */
    if (error?.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

/* ============================================================
 * List + Stats
 * ============================================================ */
export interface ListResponse extends TransactionListResponse {
  stats: TransactionStats;
}

export async function fetchTransactions(
  params: TransactionListParams,
): Promise<ListResponse> {
  const searchParams = new URLSearchParams();

  /* Filters */
  if (params.search) searchParams.set("search", params.search);

  if (params.status?.length) {
    searchParams.set("status", params.status.join(","));
  }

  if (params.channel?.length) {
    searchParams.set("channel", params.channel.join(","));
  }

  if (params.riskLevel?.length) {
    searchParams.set("riskLevel", params.riskLevel.join(","));
  }

  if (params.isFraud !== undefined) {
    searchParams.set("isFraud", String(params.isFraud));
  }

  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);

  if (params.amountMin !== undefined) {
    searchParams.set("amountMin", String(params.amountMin));
  }
  if (params.amountMax !== undefined) {
    searchParams.set("amountMax", String(params.amountMax));
  }

  if (params.merchant) searchParams.set("merchant", params.merchant);
  if (params.country) searchParams.set("country", params.country);

  /* Sorting */
  if (params.sort) {
    searchParams.set("sortField", params.sort.field);
    searchParams.set("sortDirection", params.sort.direction);
  }

  /* Pagination */
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));

  const { data } = await apiClient.get<ListResponse>(
    `/transactions?${searchParams.toString()}`,
  );

  return data;
}

/* ============================================================
 * Single Transaction
 * ============================================================ */
export async function fetchTransaction(
  id: string,
): Promise<TransactionWithRelations> {
  const { data } = await apiClient.get<{ data: TransactionWithRelations }>(
    `/transactions/${id}`,
  );
  return data.data;
}

/* ============================================================
 * Update Transaction
 * ============================================================ */
export async function updateTransaction(
  id: string,
  payload: { status?: string; merchant?: string | null; category?: string | null },
): Promise<TransactionWithRelations> {
  const { data } = await apiClient.patch<{ data: TransactionWithRelations }>(
    `/transactions/${id}`,
    payload,
  );
  return data.data;
}

/* ============================================================
 * Delete Transaction
 * ============================================================ */
export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}

/* ============================================================
 * Bulk Action
 * ============================================================ */
export async function runBulkAction(
  payload: BulkActionPayload,
): Promise<BulkActionResponse> {
  const { data } = await apiClient.post<BulkActionResponse>(
    "/transactions/bulk",
    payload,
  );
  return data;
}

/* ============================================================
 * Export
 * ============================================================ */
export async function exportTransactionsFile(
  payload: ExportRequest,
): Promise<void> {
  const response = await apiClient.post("/transactions/export", payload, {
    responseType: "blob",
  });

  /* Extract filename from Content-Disposition */
  const contentDisposition = response.headers["content-disposition"] as
    | string
    | undefined;

  let filename = `transactions-${Date.now()}.${payload.format}`;

  if (contentDisposition) {
    const match = /filename="?([^"]+)"?/.exec(contentDisposition);
    if (match?.[1]) filename = match[1];
  }

  /* Trigger download */
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}