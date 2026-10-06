"use client";

import {
  Activity,
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatAmount,
  formatCompactNumber,
} from "@/features/transactions/utils/format";
import type { TransactionStats } from "@/features/transactions/types";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: TransactionStats | undefined;
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading || !stats) {
    return <StatsCardsSkeleton />;
  }

  const cards = [
    {
      title: "Total Transactions",
      value: formatCompactNumber(stats.total),
      subValue: formatAmount(stats.totalAmount),
      icon: Activity,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      title: "Fraud Transactions",
      value: formatCompactNumber(stats.fraud),
      subValue: `Rate: ${stats.fraudRate.toFixed(2)}%`,
      icon: ShieldAlert,
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-500/10",
    },
    {
      title: "Legitimate",
      value: formatCompactNumber(stats.legitimate),
      subValue: `${(100 - stats.fraudRate).toFixed(2)}% of total`,
      icon: ShieldCheck,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      title: "Avg Amount",
      value: formatAmount(stats.avgAmount),
      subValue: `${stats.pending} pending review`,
      icon: DollarSign,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="border-border/60 bg-card/60 backdrop-blur-sm transition-shadow hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  card.iconBg,
                )}
              >
                <Icon className={cn("h-4 w-4", card.iconColor)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground">{card.subValue}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ============================================================
 * Skeleton
 * ============================================================ */
function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border/60 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================
 * Status Summary Row (compact status badges)
 * ============================================================ */
export function StatusSummaryRow({ stats }: { stats: TransactionStats }) {
  const items = [
    { label: "Pending", value: stats.pending, className: "text-amber-600 dark:text-amber-400" },
    { label: "Approved", value: stats.approved, className: "text-emerald-600 dark:text-emerald-400" },
    { label: "Flagged", value: stats.flagged, className: "text-orange-600 dark:text-orange-400" },
    { label: "Blocked", value: stats.blocked, className: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card/40 px-2.5 py-1"
        >
          <span className="text-muted-foreground">{item.label}</span>
          <span className={cn("font-semibold", item.className)}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}