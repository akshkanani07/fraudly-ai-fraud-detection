"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  StatusBadge,
  RiskBadge,
  RiskScoreBar,
} from "@/features/transactions/components/transaction-badges";
import { TRANSACTION_CHANNEL_LABELS } from "@/features/transactions/constants";
import {
  formatAmount,
  formatDateTime,
  truncate,
} from "@/features/transactions/utils/format";
import type {
  TransactionRow,
  TransactionSortField,
  SortDirection,
} from "@/features/transactions/types";
import { cn } from "@/lib/utils";

/* ============================================================
 * Props
 * ============================================================ */
interface TransactionTableProps {
  data: TransactionRow[];
  isLoading?: boolean;
  isFetching?: boolean;

  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;

  sortField: TransactionSortField;
  sortDirection: SortDirection;
  onSort: (field: TransactionSortField, direction: SortDirection) => void;

  onRowClick: (row: TransactionRow) => void;
}

/* ============================================================
 * Table
 * ============================================================ */
export function TransactionTable({
  data,
  isLoading,
  isFetching,
  selectedIds,
  onSelectionChange,
  sortField,
  sortDirection,
  onSort,
  onRowClick,
}: TransactionTableProps) {
  /* ---- Selection ---- */
  const allSelected =
    data.length > 0 && data.every((row) => selectedIds.has(row.id));
  const someSelected = data.some((row) => selectedIds.has(row.id));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selectedIds);
      data.forEach((row) => next.delete(row.id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      data.forEach((row) => next.add(row.id));
      onSelectionChange(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  /* ---- Sort ---- */
  const handleSort = (field: TransactionSortField) => {
    if (sortField === field) {
      onSort(field, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSort(field, "desc");
    }
  };

  /* ---- Empty ---- */
  if (!isLoading && data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border/60 bg-card/40 transition-opacity",
        isFetching && "opacity-60",
      )}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* Select All */}
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as unknown as HTMLInputElement).indeterminate =
                        !allSelected && someSelected;
                    }
                  }}
                  onCheckedChange={toggleAll}
                  aria-label="Select all transactions"
                />
              </TableHead>

              <SortableHead
                label="Date"
                field="transactedAt"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />

              <TableHead>Transaction</TableHead>

              <TableHead className="text-right">
                <SortableHeadInline
                  label="Amount"
                  field="amount"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                  align="right"
                />
              </TableHead>

              <TableHead>Channel</TableHead>

              <SortableHead
                label="Status"
                field="status"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />

              <TableHead>Risk</TableHead>

              <SortableHead
                label="Risk Score"
                field="riskLevel"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />

              <TableHead>Model</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  return (
                    <TableRow
                      key={row.id}
                      data-state={isSelected ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() => onRowClick(row)}
                    >
                      {/* Checkbox */}
                      <TableCell
                        onClick={(e) => e.stopPropagation()}
                        className="w-10"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(row.id)}
                          aria-label={`Select ${row.id}`}
                        />
                      </TableCell>

                      {/* Date */}
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(row.transactedAt)}
                      </TableCell>

                      {/* Transaction (Merchant + ID) */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">
                            {row.merchant ? truncate(row.merchant, 30) : "—"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {row.id.slice(0, 12)}…
                          </span>
                        </div>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="whitespace-nowrap text-right text-sm font-semibold tabular-nums">
                        {formatAmount(row.amount, row.currency)}
                      </TableCell>

                      {/* Channel */}
                      <TableCell className="text-sm text-muted-foreground">
                        {TRANSACTION_CHANNEL_LABELS[row.channel]}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>

                      {/* Risk */}
                      <TableCell>
                        <RiskBadge risk={row.riskLevel} />
                      </TableCell>

                      {/* Risk Score */}
                      <TableCell>
                        <RiskScoreBar score={row.riskScore} />
                      </TableCell>

                      {/* Model */}
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {row.modelName
                          ? `${row.modelName} v${row.modelVersion}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ============================================================
 * Sortable Head
 * ============================================================ */
interface SortableHeadProps {
  label: string;
  field: TransactionSortField;
  currentField: TransactionSortField;
  direction: SortDirection;
  onSort: (field: TransactionSortField) => void;
}

function SortableHead({
  label,
  field,
  currentField,
  direction,
  onSort,
}: SortableHeadProps) {
  const active = currentField === field;
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onSort(field)}
        className={cn(
          "-ml-2 h-8 gap-1.5 px-2 text-xs font-medium uppercase tracking-wide",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className="h-3 w-3" />
      </Button>
    </TableHead>
  );
}

interface SortableHeadInlineProps extends SortableHeadProps {
  align?: "left" | "right";
}

function SortableHeadInline({
  label,
  field,
  currentField,
  direction,
  onSort,
  align = "left",
}: SortableHeadInlineProps) {
  const active = currentField === field;
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onSort(field)}
      className={cn(
        "h-8 gap-1.5 px-2 text-xs font-medium uppercase tracking-wide",
        align === "right" && "-mr-2",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <Icon className="h-3 w-3" />
    </Button>
  );
}

/* ============================================================
 * Empty State
 * ============================================================ */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/40 px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold">No transactions found</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Try adjusting your filters or search query. New transactions will appear
        here automatically.
      </p>
    </div>
  );
}

/* ============================================================
 * TruncatedText — Tooltip on Hover (Base UI Compatible)
 * ============================================================ */
interface TruncatedTextProps {
  text: string;
  max?: number;
}

export function TruncatedText({ text, max = 40 }: TruncatedTextProps) {
  if (text.length <= max) return <span>{text}</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={<span className="cursor-help">{truncate(text, max)}</span>}
        />
        <TooltipContent>
          <p className="max-w-xs break-all">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}