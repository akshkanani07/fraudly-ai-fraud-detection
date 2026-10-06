export function formatPercent(value: number | null | undefined, digits = 1): string {
  return value === null || value === undefined || Number.isNaN(value) ? "-" : `${(value * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "-" : new Intl.NumberFormat("en-US").format(value);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatCurrency(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function humanize(name: string): string {
  return name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}