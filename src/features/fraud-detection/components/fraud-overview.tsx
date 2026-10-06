"use client";

import { Activity, Cpu, Gauge, ShieldAlert, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useFraudOverview } from "../hooks/use-fraud";
import { ALGORITHM_LABELS, type RiskLevel } from "../types";
import { formatNumber, formatPercent } from "../utils/format";
import { SectionCard, axisTick, tooltipStyle } from "./fraud-ui";

export function FraudKpis() {
  const { data, isLoading } = useFraudOverview();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-[104px] rounded-2xl" />
        ))}
      </div>
    );
  }

  const cards = [
    { icon: Activity, label: "Predictions", value: formatNumber(data.totalPredictions), tone: "text-primary" },
    { icon: ShieldAlert, label: "Fraud detected", value: formatNumber(data.fraudPredictions), tone: "text-destructive" },
    { icon: Gauge, label: "Fraud rate", value: formatPercent(data.fraudRate, 2), tone: "text-warning" },
    { icon: Timer, label: "Avg latency", value: `${Math.round(data.avgLatencyMs)} ms`, tone: "text-info" },
    {
      icon: Cpu,
      label: "Active model",
      value: data.activeModel ? data.activeModel.name : "None",
      hint: data.activeModel
        ? `${ALGORITHM_LABELS[data.activeModel.algorithm]} · F1 ${formatPercent(data.activeModel.f1Score)}`
        : "Train and activate a model",
      tone: "text-success",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ icon: Icon, label, value, hint, tone }, index) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.4 }}
          className="glass relative overflow-hidden rounded-2xl p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className={cn("flex size-9 items-center justify-center rounded-xl bg-muted/60", tone)}>
              <Icon className="size-4.5" />
            </div>
          </div>
          <p className="mt-3 truncate text-2xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p> : null}
        </motion.div>
      ))}
    </div>
  );
}

const RISK_BAR: Record<RiskLevel, string> = {
  LOW: "bg-success",
  MEDIUM: "bg-warning",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-destructive",
};

export function FraudInsights() {
  const { data, isLoading } = useFraudOverview();

  if (isLoading || !data) {
    return <Skeleton className="h-[360px] rounded-2xl" />;
  }

  const timeline = data.timeline.map((point) => ({
    ...point,
    label: new Date(`${point.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
  }));
  const maxRisk = Math.max(1, ...data.riskDistribution.map((item) => item.count));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <SectionCard title="Fraud timeline" description="Predictions and detected fraud over the last 14 days.">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="fraudTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fraudHits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
              <Area type="monotone" dataKey="total" name="Predictions" stroke="var(--chart-1)" strokeWidth={2} fill="url(#fraudTotal)" />
              <Area type="monotone" dataKey="fraud" name="Fraud" stroke="var(--destructive)" strokeWidth={2} fill="url(#fraudHits)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Risk distribution" description="How predictions are spread across risk levels.">
        <ul className="space-y-5">
          {data.riskDistribution.map(({ level, count }) => (
            <li key={level} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{level.charAt(0) + level.slice(1).toLowerCase()}</span>
                <span className="font-mono text-muted-foreground">{formatNumber(count)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={cn("h-full rounded-full", RISK_BAR[level])}
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / maxRisk) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}