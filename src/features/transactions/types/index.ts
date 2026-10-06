import type {
  Transaction,
  TransactionStatus,
  TransactionChannel,
  RiskLevel,
  Prisma,
} from "@/generated/prisma/client";

/* ============================================================
 * Base Transaction Type (with Relations)
 * ============================================================ */
export type TransactionWithRelations = Transaction & {
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  dataset?: {
    id: string;
    name: string;
  } | null;
  predictions?: Array<{
    id: string;
    isFraud: boolean;
    fraudProbability: number;
    confidence: number;
    riskLevel: RiskLevel;
    createdAt: Date;
    model: {
      id: string;
      name: string;
      version: number;
      algorithm: string;
    };
  }>;
};

/* ============================================================
 * Latest Prediction Summary (for Table Row)
 * ============================================================ */
export interface TransactionRow {
  id: string;
  externalId: string | null;
  amount: number;
  currency: string;
  merchant: string | null;
  category: string | null;
  channel: TransactionChannel;
  customerId: string | null;
  country: string | null;
  status: TransactionStatus;
  isFraudLabel: boolean | null;
  transactedAt: string;
  createdAt: string;

  /* Latest Prediction (Denormalized for Table) */
  riskLevel: RiskLevel | null;
  riskScore: number | null;
  isFraud: boolean | null;
  confidence: number | null;
  modelName: string | null;
  modelVersion: number | null;
}

/* ============================================================
 * Filters
 * ============================================================ */
export interface TransactionFilters {
  search?: string;
  status?: TransactionStatus[];
  channel?: TransactionChannel[];
  riskLevel?: RiskLevel[];
  isFraud?: boolean;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  merchant?: string;
  country?: string;
}

export type TransactionSortField =
  | "transactedAt"
  | "amount"
  | "riskLevel"
  | "createdAt"
  | "status";

export type SortDirection = "asc" | "desc";

export interface TransactionSort {
  field: TransactionSortField;
  direction: SortDirection;
}

export interface TransactionPagination {
  page: number;
  pageSize: number;
}

/* ============================================================
 * List Request / Response
 * ============================================================ */
export interface TransactionListParams
  extends TransactionFilters,
    Partial<TransactionPagination> {
  sort?: TransactionSort;
}

export interface TransactionListResponse {
  data: TransactionRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ============================================================
 * Stats (for Header Cards)
 * ============================================================ */
export interface TransactionStats {
  total: number;
  pending: number;
  approved: number;
  flagged: number;
  blocked: number;
  fraud: number;
  legitimate: number;
  fraudRate: number;
  totalAmount: number;
  avgAmount: number;
}

/* ============================================================
 * Bulk Actions
 * ============================================================ */
export type BulkActionType =
  | "UPDATE_STATUS"
  | "DELETE"
  | "EXPORT"
  | "MARK_FRAUD"
  | "MARK_LEGITIMATE";

export interface BulkActionPayload {
  action: BulkActionType;
  ids: string[];
  status?: TransactionStatus;
}

export interface BulkActionResponse {
  success: boolean;
  affected: number;
  message: string;
}

/* ============================================================
 * Export
 * ============================================================ */
export type ExportFormat = "csv" | "xlsx" | "pdf";

export interface ExportRequest {
  format: ExportFormat;
  filters?: TransactionFilters;
  ids?: string[];
}

/* ============================================================
 * Prisma Helpers (Re-export)
 * ============================================================ */
export type { Transaction, TransactionStatus, TransactionChannel, RiskLevel };

export type TransactionWhereInput = Prisma.TransactionWhereInput;
export type TransactionOrderByInput = Prisma.TransactionOrderByWithRelationInput;