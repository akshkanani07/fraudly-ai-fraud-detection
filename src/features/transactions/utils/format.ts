import {
  formatCurrency,
  DEFAULT_CURRENCY,
} from "@/features/transactions/constants";

/* ============================================================
 * Amount Format
 * ============================================================ */
export function formatAmount(
  amount: number | string,
  currency: string = DEFAULT_CURRENCY,
): string {
  return formatCurrency(amount, currency);
}

/* ============================================================
 * Compact Number (1.2K, 3.4M)
 * ============================================================ */
export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1) + "B";
  }
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + "M";
  }
  if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(1) + "K";
  }
  return value.toString();
}

/* ============================================================
 * Date Format
 * ============================================================ */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return formatDate(d);
}

/* ============================================================
 * Percentage
 * ============================================================ */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/* ============================================================
 * Risk Score → Color
 * ============================================================ */
export function getRiskScoreColor(score: number): string {
  if (score >= 0.75) return "text-red-600 dark:text-red-400";
  if (score >= 0.5) return "text-orange-600 dark:text-orange-400";
  if (score >= 0.25) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

/* ============================================================
 * Truncate
 * ============================================================ */
export function truncate(str: string, length: number = 40): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 1) + "…";
}

/* ============================================================
 * Initials (Avatar)
 * ============================================================ */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}