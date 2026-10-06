"use client";

import { Badge } from "@/components/ui/badge";
import {
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUS_STYLES,
  RISK_LEVEL_LABELS,
  RISK_LEVEL_STYLES,
} from "@/features/transactions/constants";
import type {
  TransactionStatus,
  RiskLevel,
} from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

/* ============================================================
 * Status Badge
 * ============================================================ */
interface StatusBadgeProps {
  status: TransactionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
        TRANSACTION_STATUS_STYLES[status],
        className,
      )}
    >
      {TRANSACTION_STATUS_LABELS[status]}
    </Badge>
  );
}

/* ============================================================
 * Risk Badge
 * ============================================================ */
interface RiskBadgeProps {
  risk: RiskLevel | null;
  className?: string;
}

export function RiskBadge({ risk, className }: RiskBadgeProps) {
  if (!risk) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] font-normal text-muted-foreground",
          className,
        )}
      >
        No Score
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
        RISK_LEVEL_STYLES[risk],
        className,
      )}
    >
      {RISK_LEVEL_LABELS[risk]}
    </Badge>
  );
}

/* ============================================================
 * Fraud Indicator (Dot)
 * ============================================================ */
interface FraudIndicatorProps {
  isFraud: boolean | null;
  className?: string;
}

export function FraudIndicator({ isFraud, className }: FraudIndicatorProps) {
  if (isFraud === null) {
    return (
      <span
        aria-label="Unknown"
        className={cn(
          "inline-block h-2 w-2 rounded-full bg-muted-foreground/40",
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-label={isFraud ? "Fraud" : "Legitimate"}
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        isFraud
          ? "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
          : "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]",
        className,
      )}
    />
  );
}

/* ============================================================
 * Risk Score Bar (Inline)
 * ============================================================ */
interface RiskScoreBarProps {
  score: number | null;
  className?: string;
}

export function RiskScoreBar({ score, className }: RiskScoreBarProps) {
  if (score === null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const pct = Math.round(score * 100);

  const color =
    pct >= 75
      ? "bg-red-500"
      : pct >= 50
        ? "bg-orange-500"
        : pct >= 25
          ? "bg-amber-500"
          : "bg-emerald-500";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 text-right text-xs font-medium tabular-nums">
        {pct}%
      </span>
    </div>
  );
}