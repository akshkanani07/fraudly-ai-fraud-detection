"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import type { FraudFactor, RiskLevel } from "../types";
import { formatPercent, humanize } from "../utils/format";
import { RiskBadge, Stat } from "./fraud-ui";

/* ============================================================
 * Display Type
 * ============================================================ */
export interface PredictionDisplay {
  isFraud: boolean;
  fraudProbability: number;
  confidence: number;
  riskLevel: RiskLevel;
  threshold: number | null;
  factors: FraudFactor[];
  missingFeatures: string[];
  latencyMs: number | null;
  modelName?: string;
  transactionStatus?: string;
}

/* ============================================================
 * Risk Gauge
 * ============================================================ */
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function RiskGauge({
  probability,
  isFraud,
}: {
  probability: number;
  isFraud: boolean;
}) {
  return (
    <div className="relative size-36 shrink-0">
      <svg
        viewBox="0 0 120 120"
        className="size-36 -rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          className="stroke-muted"
        />

        {/* Progress */}
        <motion.circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{
            strokeDashoffset: CIRCUMFERENCE * (1 - probability),
          }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            isFraud ? "stroke-red-500" : "stroke-emerald-500",
          )}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-semibold tracking-tight">
          {(probability * 100).toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground">fraud risk %</span>
      </div>
    </div>
  );
}

/* ============================================================
 * Factor Bars (SHAP-like)
 * ============================================================ */
function FactorBars({ factors }: { factors: FraudFactor[] }) {
  const max = Math.max(
    ...factors.map((factor) => Math.abs(factor.contribution)),
    1e-9,
  );

  return (
    <ul className="space-y-3.5">
      {factors.map((factor) => {
        const increases = factor.direction === "increases_risk";
        const width = (Math.abs(factor.contribution) / max) * 50;

        return (
          <li key={factor.feature} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate font-medium">
                {humanize(factor.feature)}
              </span>
              <span className="truncate font-mono text-muted-foreground">
                {factor.value === null
                  ? "missing"
                  : typeof factor.value === "number"
                    ? Number(factor.value.toFixed(3))
                    : String(factor.value)}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-muted">
              {/* Center line */}
              <span className="absolute top-0 left-1/2 h-full w-px bg-border" />

              {/* Bar */}
              <motion.span
                className={cn(
                  "absolute top-0 h-full rounded-full",
                  increases ? "bg-red-500" : "bg-emerald-500",
                )}
                style={
                  increases ? { left: "50%" } : { right: "50%" }
                }
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ============================================================
 * Main Prediction Result View
 * ============================================================ */
export function PredictionResultView({
  result,
}: {
  result: PredictionDisplay;
}) {
  const Icon = result.isFraud ? ShieldAlert : ShieldCheck;

  return (
    <div className="space-y-6">
      {/* ---- Verdict Header ---- */}
      <div
        className={cn(
          "flex items-center gap-4 rounded-2xl border p-4",
          result.isFraud
            ? "border-red-500/30 bg-red-500/10"
            : "border-emerald-500/30 bg-emerald-500/10",
        )}
      >
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl text-white",
            result.isFraud ? "bg-red-500" : "bg-emerald-500",
          )}
        >
          <Icon className="size-6" />
        </div>

        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight">
            {result.isFraud
              ? "Fraudulent transaction"
              : "Legitimate transaction"}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {result.modelName ? result.modelName : "Prediction"}
            {result.transactionStatus
              ? ` · ${result.transactionStatus.toLowerCase()}`
              : ""}
          </p>
        </div>

        <div className="ml-auto">
          <RiskBadge level={result.riskLevel} />
        </div>
      </div>

      {/* ---- Gauge + Stats ---- */}
      <div className="flex flex-wrap items-center gap-6">
        <RiskGauge
          probability={result.fraudProbability}
          isFraud={result.isFraud}
        />

        <div className="grid min-w-[220px] flex-1 grid-cols-2 gap-3">
          <Stat
            label="Confidence"
            value={formatPercent(result.confidence)}
          />
          <Stat
            label="Decision threshold"
            value={formatPercent(result.threshold)}
          />
          <Stat
            label="Latency"
            value={
              result.latencyMs === null
                ? "-"
                : `${result.latencyMs.toFixed(1)} ms`
            }
          />
          <Stat
            label="Missing inputs"
            value={result.missingFeatures.length}
            hint={
              result.missingFeatures.length
                ? "auto-imputed"
                : "none"
            }
          />
        </div>
      </div>

      {/* ---- Explanation ---- */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold">
            Why this prediction
          </h4>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              Lowers risk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-500" />
              Raises risk
            </span>
          </div>
        </div>

        {result.factors.length > 0 ? (
          <FactorBars factors={result.factors} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No explanation is available for this prediction.
          </p>
        )}
      </div>
    </div>
  );
}