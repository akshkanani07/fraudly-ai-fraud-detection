import { Activity, BrainCircuit, LockKeyhole, ShieldCheck, Zap } from "lucide-react";

import { clientEnv } from "@/config/env";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="gradient-brand flex size-10 items-center justify-center rounded-xl shadow-lg shadow-primary/30 ring-1 ring-white/20">
        <ShieldCheck className="size-5 text-white" strokeWidth={2.25} />
      </div>
      <span className="text-xl font-semibold tracking-tight">
        {clientEnv.NEXT_PUBLIC_APP_NAME}
      </span>
    </div>
  );
}

const FEATURES = [
  {
    icon: Zap,
    title: "Real-time risk scoring",
    description: "Every transaction is scored in milliseconds with a confidence value.",
  },
  {
    icon: BrainCircuit,
    title: "Explainable AI",
    description: "See exactly which signals pushed a transaction toward fraud.",
  },
  {
    icon: LockKeyhole,
    title: "Enterprise-grade security",
    description: "Role-based access, audit trails and secure sessions by default.",
  },
] as const;

const SAMPLE_TRANSACTIONS = [
  {
    merchant: "Nova Electronics",
    amount: "$4,820.00",
    risk: 94,
    status: "Blocked",
    badge: "bg-destructive/15 text-destructive",
  },
  {
    merchant: "Orbit Travel",
    amount: "$1,250.00",
    risk: 67,
    status: "Flagged",
    badge: "bg-warning/15 text-warning",
  },
  {
    merchant: "City Grocers",
    amount: "$42.10",
    risk: 3,
    status: "Approved",
    badge: "bg-success/15 text-success",
  },
] as const;

const GAUGE_RADIUS = 34;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;
const GAUGE_VALUE = 94;

function RiskPreviewCard() {
  const dashOffset = GAUGE_CIRCUMFERENCE * (1 - GAUGE_VALUE / 100);

  return (
    <div className="glass-strong relative w-full max-w-md rounded-3xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-success" />
          </span>
          Live risk analysis
        </div>
        <Activity className="size-4 text-muted-foreground" />
      </div>

      <div className="mb-5 flex items-center gap-5 rounded-2xl border border-border/60 bg-background/40 p-4">
        <div className="relative size-20 shrink-0">
          <svg viewBox="0 0 80 80" className="size-20 -rotate-90" aria-hidden="true">
            <circle
              cx="40"
              cy="40"
              r={GAUGE_RADIUS}
              fill="none"
              strokeWidth="7"
              className="stroke-muted"
            />
            <circle
              cx="40"
              cy="40"
              r={GAUGE_RADIUS}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={GAUGE_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="stroke-destructive"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-lg leading-none font-semibold">{GAUGE_VALUE}</span>
            <span className="text-[10px] text-muted-foreground">risk</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">High-risk transaction detected</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Unusual amount, new device and mismatched location contributed most to this score.
          </p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {SAMPLE_TRANSACTIONS.map((transaction) => (
          <li
            key={transaction.merchant}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/30 px-3.5 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{transaction.merchant}</p>
              <p className="font-mono text-xs text-muted-foreground">{transaction.amount}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">
                {transaction.risk}%
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium",
                  transaction.badge,
                )}
              >
                {transaction.status}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-center text-[11px] text-muted-foreground/80">
        Illustrative preview with sample data
      </p>
    </div>
  );
}

export function AuthBrandPanel() {
  const year = new Date().getFullYear();

  return (
    <aside className="relative hidden overflow-hidden border-r border-border bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div aria-hidden="true" className="bg-aurora pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-70" />
      <div
        aria-hidden="true"
        className="gradient-brand pointer-events-none absolute -bottom-40 -left-32 size-96 animate-pulse-glow rounded-full opacity-20 blur-3xl"
      />

      <div className="relative z-10">
        <BrandLogo />
      </div>

      <div className="relative z-10 space-y-10">
        <div className="animate-fade-up space-y-4">
          <h1 className="max-w-lg text-4xl leading-[1.1] font-semibold tracking-tight xl:text-5xl">
            Stop fraud <span className="gradient-text">before it happens.</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            An enterprise AI platform that monitors transactions in real time, scores risk
            with machine learning and explains every decision.
          </p>
        </div>

        <div className="animate-float">
          <RiskPreviewCard />
        </div>

        <ul className="grid max-w-xl gap-5 sm:grid-cols-1 xl:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li key={title} className="space-y-2">
              <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background/40 text-primary">
                <Icon className="size-4.5" />
              </div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-xs text-muted-foreground">
        &copy; {year} {clientEnv.NEXT_PUBLIC_APP_NAME}. All rights reserved.
      </p>
    </aside>
  );
}