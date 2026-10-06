import type {
  TransactionStatus,
  TransactionChannel,
  RiskLevel,
} from "@/generated/prisma/client";

/* ============================================================
 * Transaction Status
 * ============================================================ */
export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  FLAGGED: "Flagged",
  BLOCKED: "Blocked",
};

export const TRANSACTION_STATUS_STYLES: Record<TransactionStatus, string> = {
  PENDING:
    "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
  APPROVED:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  FLAGGED:
    "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400",
  BLOCKED:
    "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400",
};

export const TRANSACTION_STATUS_OPTIONS: Array<{
  value: TransactionStatus;
  label: string;
}> = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "FLAGGED", label: "Flagged" },
  { value: "BLOCKED", label: "Blocked" },
];

/* ============================================================
 * Transaction Channel
 * ============================================================ */
export const TRANSACTION_CHANNEL_LABELS: Record<TransactionChannel, string> = {
  ONLINE: "Online",
  POS: "POS",
  ATM: "ATM",
  MOBILE: "Mobile",
  TRANSFER: "Transfer",
};

export const TRANSACTION_CHANNEL_OPTIONS: Array<{
  value: TransactionChannel;
  label: string;
}> = [
  { value: "ONLINE", label: "Online" },
  { value: "POS", label: "POS" },
  { value: "ATM", label: "ATM" },
  { value: "MOBILE", label: "Mobile" },
  { value: "TRANSFER", label: "Transfer" },
];

/* ============================================================
 * Risk Level
 * ============================================================ */
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const RISK_LEVEL_STYLES: Record<RiskLevel, string> = {
  LOW: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  MEDIUM: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
  HIGH: "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400",
  CRITICAL: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400",
};

export const RISK_LEVEL_OPTIONS: Array<{
  value: RiskLevel;
  label: string;
}> = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

/* ============================================================
 * Sort Options
 * ============================================================ */
export const SORT_FIELD_OPTIONS = [
  { value: "transactedAt", label: "Transaction Date" },
  { value: "amount", label: "Amount" },
  { value: "riskLevel", label: "Risk Level" },
  { value: "createdAt", label: "Created Date" },
  { value: "status", label: "Status" },
] as const;

/* ============================================================
 * Pagination
 * ============================================================ */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

/* ============================================================
 * Currency
 * ============================================================ */
export const DEFAULT_CURRENCY = "USD";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
};

export function formatCurrency(
  amount: number | string,
  currency: string = DEFAULT_CURRENCY,
): string {
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;

  return `${symbol}${numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}