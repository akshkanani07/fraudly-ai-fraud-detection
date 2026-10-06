"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { usePredictions } from "../hooks/use-fraud";
import {
  RISK_LEVELS,
  type PredictionHistoryItem,
  type RiskLevel,
} from "../types";
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
} from "../utils/format";
import {
  AlgorithmBadge,
  EmptyState,
  NativeSelect,
  RiskBadge,
  SectionCard,
  VerdictBadge,
} from "./fraud-ui";
import { PredictionResultView } from "./prediction-result";

const PAGE_SIZE = 10;

/* ============================================================
 * Prediction History
 * ============================================================ */
export function PredictionHistory() {
  const [page, setPage] = useState(1);
  const [risk, setRisk] = useState<RiskLevel | "">("");
  const [verdict, setVerdict] = useState<"fraud" | "legit" | "">("");
  const [selected, setSelected] = useState<PredictionHistoryItem | null>(
    null,
  );

  const { data, isLoading, isFetching } = usePredictions({
    page,
    pageSize: PAGE_SIZE,
    ...(risk ? { risk } : {}),
    ...(verdict ? { verdict } : {}),
  });

  const totalPages = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / PAGE_SIZE),
  );

  return (
    <SectionCard
      title="Prediction history"
      description="Every real-time prediction, with the model and transaction behind it."
      action={
        <div className="flex flex-wrap gap-3">
          {/* ====================================================
              Verdict Filter — Shadcn Select
              ==================================================== */}
          <NativeSelect
            aria-label="Filter by verdict"
            className="h-9 w-40"
            value={verdict}
            onChange={(value) => {
              setVerdict(value as typeof verdict);
              setPage(1);
            }}
            placeholder="All verdicts"
          >
            <option value="">All verdicts</option>
            <option value="fraud">Fraud</option>
            <option value="legit">Legitimate</option>
          </NativeSelect>

          {/* ====================================================
              Risk Filter — Shadcn Select
              ==================================================== */}
          <NativeSelect
            aria-label="Filter by risk level"
            className="h-9 w-40"
            value={risk}
            onChange={(value) => {
              setRisk(value as typeof risk);
              setPage(1);
            }}
            placeholder="All risk levels"
          >
            <option value="">All risk levels</option>
            {RISK_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0) + level.slice(1).toLowerCase()}
              </option>
            ))}
          </NativeSelect>
        </div>
      }
    >
      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No predictions found"
          description="Run a prediction from the Live Detection tab and it will appear here."
        />
      ) : (
        <>
          <div
            className={cn(
              "overflow-x-auto transition-opacity",
              isFetching && "opacity-60",
            )}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>Fraud probability</TableHead>
                  <TableHead>Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(item)}
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </TableCell>

                    <TableCell>
                      <p className="font-mono text-sm font-medium">
                        {formatCurrency(
                          item.transaction.amount,
                          item.transaction.currency,
                        )}
                      </p>
                      <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {[
                          item.transaction.merchant,
                          item.transaction.category,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "No merchant"}
                      </p>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <p className="max-w-[160px] truncate text-sm">
                          {item.model.name.split(" \u00b7 ")[0]}
                        </p>
                        <AlgorithmBadge algorithm={item.model.algorithm} />
                      </div>
                    </TableCell>

                    <TableCell>
                      <VerdictBadge isFraud={item.isFraud} />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              item.isFraud
                                ? "bg-red-500"
                                : "bg-emerald-500",
                            )}
                            style={{
                              width: `${item.fraudProbability * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-xs">
                          {formatPercent(item.fraudProbability)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <RiskBadge level={item.riskLevel} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ---- Pagination ---- */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Page {data.page} of {totalPages} ·{" "}
              {data.total.toLocaleString("en-US")} predictions
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ---- Detail Dialog ---- */}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prediction details</DialogTitle>
            <DialogDescription>
              {selected ? formatDateTime(selected.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <PredictionResultView
              result={{
                isFraud: selected.isFraud,
                fraudProbability: selected.fraudProbability,
                confidence: selected.confidence,
                riskLevel: selected.riskLevel,
                threshold: selected.threshold,
                factors: selected.factors,
                missingFeatures: selected.missingFeatures,
                latencyMs: selected.latencyMs,
                modelName: selected.model.name.split(" \u00b7 ")[0],
                transactionStatus: selected.transaction.status,
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}