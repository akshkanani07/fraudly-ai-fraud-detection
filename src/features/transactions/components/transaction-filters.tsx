"use client";

import { useState } from "react";
import { Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TRANSACTION_STATUS_OPTIONS,
  TRANSACTION_CHANNEL_OPTIONS,
  RISK_LEVEL_OPTIONS,
} from "@/features/transactions/constants";
import type { TransactionFilters as Filters } from "@/features/transactions/types";

/* ============================================================
 * Multi-Select Checkbox Group
 * ============================================================ */
interface MultiSelectGroupProps<T extends string> {
  label: string;
  options: Array<{ value: T; label: string }>;
  values: T[] | undefined;
  onChange: (values: T[]) => void;
}

function MultiSelectGroup<T extends string>({
  label,
  options,
  values = [],
  onChange,
}: MultiSelectGroupProps<T>) {
  const toggle = (val: T) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  return (
    <div className="space-y-2.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <Checkbox
              checked={values.includes(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * Main Filter Panel
 * ============================================================ */
interface TransactionFiltersProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  activeCount: number;
}

export function TransactionFilters({
  filters,
  onChange,
  onReset,
  activeCount,
}: TransactionFiltersProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="default" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-xs"
              >
                {activeCount}
              </Badge>
            )}
          </Button>
        }
      />

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        alignOffset={0}
        className="z-50 max-h-[80vh] w-[min(calc(100vw-2rem),480px)] overflow-hidden p-0 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3">
          <div className="text-sm font-semibold">Advanced Filters</div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={activeCount === 0}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="max-h-[55vh] space-y-5 overflow-y-auto p-4">
          <MultiSelectGroup
            label="Status"
            options={TRANSACTION_STATUS_OPTIONS}
            values={filters.status}
            onChange={(v) => onChange({ status: v.length ? v : undefined })}
          />

          <Separator />

          <MultiSelectGroup
            label="Channel"
            options={TRANSACTION_CHANNEL_OPTIONS}
            values={filters.channel}
            onChange={(v) => onChange({ channel: v.length ? v : undefined })}
          />

          <Separator />

          <MultiSelectGroup
            label="Risk Level"
            options={RISK_LEVEL_OPTIONS}
            values={filters.riskLevel}
            onChange={(v) => onChange({ riskLevel: v.length ? v : undefined })}
          />

          <Separator />

          {/* Fraud Label */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fraud Label
            </Label>
            <Select
              value={
                filters.isFraud === undefined
                  ? "all"
                  : filters.isFraud
                    ? "fraud"
                    : "legitimate"
              }
              onValueChange={(val) => {
                if (val === "all") onChange({ isFraud: undefined });
                else onChange({ isFraud: val === "fraud" });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="fraud">Fraud only</SelectItem>
                <SelectItem value="legitimate">Legitimate only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">From</span>
                <Input
                  type="date"
                  value={filters.dateFrom?.split("T")[0] ?? ""}
                  onChange={(e) =>
                    onChange({
                      dateFrom: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">To</span>
                <Input
                  type="date"
                  value={filters.dateTo?.split("T")[0] ?? ""}
                  onChange={(e) =>
                    onChange({
                      dateTo: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Amount Range */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Amount Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Min</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="0"
                  value={filters.amountMin ?? ""}
                  onChange={(e) =>
                    onChange({
                      amountMin:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Max</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="∞"
                  value={filters.amountMax ?? ""}
                  onChange={(e) =>
                    onChange({
                      amountMax:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Country */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Country Code
            </Label>
            <Input
              type="text"
              maxLength={2}
              placeholder="US, GB, IN..."
              value={filters.country ?? ""}
              onChange={(e) =>
                onChange({
                  country:
                    e.target.value === ""
                      ? undefined
                      : e.target.value.toUpperCase(),
                })
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 bg-muted/30 p-3">
          <Button
            type="button"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}