"use client";

import {
  Activity,
  AlertTriangle,
  Calendar,
  CreditCard,
  DollarSign,
  Globe,
  Hash,
  Loader2,
  MapPin,
  Shield,
  Smartphone,
  User,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  StatusBadge,
  RiskBadge,
} from "@/features/transactions/components/transaction-badges";
import { TRANSACTION_CHANNEL_LABELS } from "@/features/transactions/constants";
import {
  formatAmount,
  formatDateTime,
  formatPercent,
} from "@/features/transactions/utils/format";
import { useTransaction } from "@/features/transactions/hooks/use-transaction";

/* ============================================================
 * Prediction Type
 * ============================================================ */
interface PredictionData {
  id: string;
  isFraud: boolean;
  fraudProbability: number;
  confidence: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  explanation: unknown;
  latencyMs: number | null;
  createdAt: string | Date;
  model: {
    id: string;
    name: string;
    version: number;
    algorithm: string;
  };
}

interface TransactionDetailDialogProps {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailDialog({
  transactionId,
  open,
  onOpenChange,
}: TransactionDetailDialogProps) {
  const { data, isLoading } = useTransaction(open ? transactionId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          flex max-h-[90vh] w-full max-w-3xl flex-col gap-0
          overflow-hidden rounded-xl border border-border/60
          bg-background/95 p-0 shadow-2xl backdrop-blur-xl
        "
      >
        {isLoading || !data ? (
          <DialogLoadingState />
        ) : (
          <>
            {/* ===== Header (Fixed) ===== */}
            <DialogHeader
              className="
                shrink-0 border-b border-border/60 bg-muted/30
                px-6 py-4 pr-12
              "
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="truncate text-lg">
                    {data.merchant ?? "Transaction"}
                  </DialogTitle>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                    {data.id}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge
                    status={
                      data.status as
                        | "PENDING"
                        | "APPROVED"
                        | "FLAGGED"
                        | "BLOCKED"
                    }
                  />
                  {data.isFraudLabel !== null && (
                    <Badge
                      variant="outline"
                      className={
                        data.isFraudLabel
                          ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }
                    >
                      {data.isFraudLabel ? "Fraud" : "Legit"}
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* ===== Scrollable Body ===== */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="space-y-6 px-6 py-5">
                {/* Amount Hero */}
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    Amount
                  </div>
                  <div className="mt-1 text-3xl font-bold tracking-tight">
                    {formatAmount(
                      Number(data.amount),
                      data.currency ?? "USD",
                    )}
                  </div>
                </div>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailItem
                    icon={<Calendar className="h-4 w-4" />}
                    label="Transacted At"
                    value={formatDateTime(data.transactedAt)}
                  />
                  <DetailItem
                    icon={<Activity className="h-4 w-4" />}
                    label="Channel"
                    value={
                      TRANSACTION_CHANNEL_LABELS[
                        data.channel as keyof typeof TRANSACTION_CHANNEL_LABELS
                      ] ?? data.channel
                    }
                  />
                  <DetailItem
                    icon={<Hash className="h-4 w-4" />}
                    label="External ID"
                    value={data.externalId ?? "—"}
                  />
                  <DetailItem
                    icon={<CreditCard className="h-4 w-4" />}
                    label="Category"
                    value={data.category ?? "—"}
                  />
                  <DetailItem
                    icon={<User className="h-4 w-4" />}
                    label="Customer ID"
                    value={data.customerId ?? "—"}
                  />
                  <DetailItem
                    icon={<Smartphone className="h-4 w-4" />}
                    label="Device ID"
                    value={data.deviceId ?? "—"}
                  />
                  <DetailItem
                    icon={<Globe className="h-4 w-4" />}
                    label="Country"
                    value={data.country ?? "—"}
                  />
                  <DetailItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="IP Address"
                    value={data.ipAddress ?? "—"}
                  />
                </div>

                {/* Additional Features */}
                {data.features &&
                  typeof data.features === "object" &&
                  Object.keys(data.features as Record<string, unknown>).length >
                    0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="mb-3 text-sm font-semibold">
                          Additional Features
                        </h4>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {Object.entries(
                            data.features as Record<string, unknown>,
                          ).map(([key, value]) => (
                            <div
                              key={key}
                              className="min-w-0 rounded-md border border-border/60 bg-muted/30 px-3 py-2"
                            >
                              <div className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                                {key}
                              </div>
                              <div className="mt-0.5 truncate text-sm font-medium">
                                {String(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                {/* Predictions */}
                {data.predictions && data.predictions.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-semibold">
                          Model Predictions ({data.predictions.length})
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {data.predictions.map((pred, index) => (
                          <PredictionCard
                            key={pred.id}
                            prediction={pred as PredictionData}
                            index={index}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Empty Predictions */}
                {(!data.predictions || data.predictions.length === 0) && (
                  <>
                    <Separator />
                    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center">
                      <AlertTriangle className="mx-auto h-5 w-5 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No predictions available yet.
                      </p>
                    </div>
                  </>
                )}

                {/* Timestamps */}
                <Separator />
                <div className="grid grid-cols-1 gap-3 pb-2 text-xs sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Created:</span>{" "}
                    <span className="font-medium">
                      {formatDateTime(data.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>{" "}
                    <span className="font-medium">
                      {formatDateTime(data.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 * Prediction Card
 * ============================================================ */
interface PredictionCardProps {
  prediction: PredictionData;
  index: number;
}

function PredictionCard({ prediction, index }: PredictionCardProps) {
  const explanations = extractExplanations(prediction.explanation);

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            #{index + 1}
          </Badge>
          <span className="text-sm font-semibold">
            {prediction.model.name}{" "}
            <span className="text-muted-foreground">
              v{prediction.model.version}
            </span>
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {prediction.model.algorithm}
          </Badge>
        </div>
        <RiskBadge risk={prediction.riskLevel} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Prediction
          </div>
          <div
            className={
              prediction.isFraud
                ? "mt-1 text-sm font-semibold text-red-600 dark:text-red-400"
                : "mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
            }
          >
            {prediction.isFraud ? "Fraud" : "Legitimate"}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Fraud Probability
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatPercent(prediction.fraudProbability, 2)}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Confidence
          </div>
          <div className="mt-1 text-sm font-semibold">
            {formatPercent(prediction.confidence, 2)}
          </div>
        </div>
      </div>

      {/* Explanations */}
      {explanations.length > 0 && (
        <div className="mt-4 border-t border-border/40 pt-3">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            Top Contributing Factors
          </div>
          <div className="space-y-1.5">
            {explanations.slice(0, 5).map((exp, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="truncate text-muted-foreground">
                  {exp.feature}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className={
                        exp.direction === "increases_fraud"
                          ? "h-full rounded-full bg-red-500"
                          : "h-full rounded-full bg-emerald-500"
                      }
                      style={{
                        width: `${Math.min(Math.abs(exp.impact) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right font-medium tabular-nums">
                    {exp.direction === "increases_fraud" ? "+" : "−"}
                    {Math.abs(exp.impact * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{formatDateTime(prediction.createdAt)}</span>
        {prediction.latencyMs !== null && (
          <span>Latency: {prediction.latencyMs}ms</span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * Explanation Extraction
 * ============================================================ */
interface Explanation {
  feature: string;
  impact: number;
  direction: "increases_fraud" | "decreases_fraud";
}

function extractExplanations(raw: unknown): Explanation[] {
  if (!raw || typeof raw !== "object") return [];

  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.contributions)) {
    return obj.contributions as Explanation[];
  }

  const entries = Object.entries(obj).filter(
    ([, v]) => typeof v === "number",
  );

  if (entries.length === 0) return [];

  return entries
    .map(([feature, value]) => ({
      feature,
      impact: Math.abs(value as number),
      direction:
        (value as number) >= 0
          ? ("increases_fraud" as const)
          : ("decreases_fraud" as const),
    }))
    .sort((a, b) => b.impact - a.impact);
}

/* ============================================================
 * Detail Item
 * ============================================================ */
interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function DetailItem({ icon, label, value }: DetailItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

/* ============================================================
 * Loading State
 * ============================================================ */
function DialogLoadingState() {
  return (
    <>
      <DialogHeader className="shrink-0 border-b border-border/60 bg-muted/30 px-6 py-4 pr-12">
        <DialogTitle className="sr-only">Loading transaction</DialogTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading transaction details...
        </div>
      </DialogHeader>

      <div className="space-y-4 p-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}