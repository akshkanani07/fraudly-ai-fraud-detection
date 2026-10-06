"use client";

import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_CHANNEL_LABELS,
  RISK_LEVEL_LABELS,
} from "@/features/transactions/constants";
import type { TransactionFilters as Filters } from "@/features/transactions/types";

interface ActiveFiltersProps {
  filters: Filters;
  onRemove: (key: keyof Filters) => void;
  onReset: () => void;
  activeCount: number;
}

export function ActiveFilters({
  filters,
  onRemove,
  onReset,
  activeCount,
}: ActiveFiltersProps) {
  if (activeCount === 0) return null;

  const chips: Array<{ key: keyof Filters; label: string }> = [];

  if (filters.search) {
    chips.push({ key: "search", label: `Search: "${filters.search}"` });
  }

  filters.status?.forEach((s) => {
    chips.push({ key: "status", label: `Status: ${TRANSACTION_STATUS_LABELS[s]}` });
  });

  filters.channel?.forEach((c) => {
    chips.push({ key: "channel", label: `Channel: ${TRANSACTION_CHANNEL_LABELS[c]}` });
  });

  filters.riskLevel?.forEach((r) => {
    chips.push({ key: "riskLevel", label: `Risk: ${RISK_LEVEL_LABELS[r]}` });
  });

  if (filters.isFraud !== undefined) {
    chips.push({
      key: "isFraud",
      label: filters.isFraud ? "Fraud only" : "Legitimate only",
    });
  }

  if (filters.dateFrom) {
    chips.push({
      key: "dateFrom",
      label: `From: ${new Date(filters.dateFrom).toLocaleDateString()}`,
    });
  }

  if (filters.dateTo) {
    chips.push({
      key: "dateTo",
      label: `To: ${new Date(filters.dateTo).toLocaleDateString()}`,
    });
  }

  if (filters.amountMin !== undefined) {
    chips.push({ key: "amountMin", label: `Min: $${filters.amountMin}` });
  }

  if (filters.amountMax !== undefined) {
    chips.push({ key: "amountMax", label: `Max: $${filters.amountMax}` });
  }

  if (filters.merchant) {
    chips.push({ key: "merchant", label: `Merchant: ${filters.merchant}` });
  }

  if (filters.country) {
    chips.push({ key: "country", label: `Country: ${filters.country}` });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        Active:
      </span>

      {chips.map((chip, idx) => (
        <Badge
          key={`${chip.key}-${idx}`}
          variant="secondary"
          className="gap-1.5 rounded-full py-1 pl-2.5 pr-1 text-xs"
        >
          <span className="max-w-[220px] truncate">{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="rounded-full p-0.5 transition-colors hover:bg-foreground/10"
            aria-label={`Remove ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Clear all
      </Button>
    </div>
  );
}