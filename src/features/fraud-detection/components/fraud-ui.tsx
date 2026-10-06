"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ALGORITHM_LABELS, type Algorithm, type RiskLevel } from "../types";

/* ============================================================
 * Field Class
 * ============================================================ */
export const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

export const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--popover-foreground)",
  boxShadow: "0 12px 32px -12px rgb(0 0 0 / 0.5)",
} as const;

export const axisTick = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
} as const;

/* ============================================================
 * Section Card
 * ============================================================ */
interface SectionCardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  description,
  action,
  className,
  children,
}: SectionCardProps) {
  return (
    <section className={cn("glass rounded-2xl p-5 sm:p-6", className)}>
      {title || action ? (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            {title ? (
              <h3 className="text-base font-semibold tracking-tight">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/* ============================================================
 * Risk Badge
 * ============================================================ */
const RISK_STYLES: Record<RiskLevel, string> = {
  LOW: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/25 dark:text-emerald-400",
  MEDIUM:
    "bg-amber-500/15 text-amber-600 ring-amber-500/25 dark:text-amber-400",
  HIGH: "bg-red-500/15 text-red-600 ring-red-500/30 dark:text-red-400",
  CRITICAL: "bg-red-600 text-white ring-red-600",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        RISK_STYLES[level],
      )}
    >
      {level.charAt(0) + level.slice(1).toLowerCase()}
    </span>
  );
}

/* ============================================================
 * Verdict Badge
 * ============================================================ */
export function VerdictBadge({ isFraud }: { isFraud: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        isFraud
          ? "bg-red-500/15 text-red-600 ring-red-500/30 dark:text-red-400"
          : "bg-emerald-500/15 text-emerald-600 ring-emerald-500/25 dark:text-emerald-400",
      )}
    >
      {isFraud ? "Fraud" : "Legitimate"}
    </span>
  );
}

/* ============================================================
 * Algorithm Badge
 * ============================================================ */
export function AlgorithmBadge({ algorithm }: { algorithm: Algorithm }) {
  return (
    <span className="inline-flex rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {ALGORITHM_LABELS[algorithm]}
    </span>
  );
}

/* ============================================================
 * Empty State
 * ============================================================ */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/40 text-primary">
        <Icon className="size-6" />
      </div>
      <h4 className="text-base font-semibold">{title}</h4>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

/* ============================================================
 * NativeSelect Helpers
 * ============================================================ */
function extractLabel(
  children: React.ReactNode,
  fallback: string,
): string {
  if (children === null || children === undefined || children === false) {
    return "";
  }

  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (typeof children === "boolean") return String(children);

  if (Array.isArray(children)) {
    return children
      .map((child) => extractLabel(child, ""))
      .filter((s) => s.length > 0)
      .join("");
  }

  if (typeof children === "object" && "props" in children) {
    const el = children as {
      props?: { children?: React.ReactNode };
    };
    if (el.props?.children !== undefined) {
      return extractLabel(el.props.children, fallback);
    }
  }

  return fallback;
}

function extractValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map(extractValue).filter(Boolean).join("");
  }
  return "";
}

function extractOptions(
  children: React.ReactNode,
): Array<{ value: string; label: string }> {
  const result: Array<{ value: string; label: string }> = [];

  const walk = (node: React.ReactNode) => {
    if (node === null || node === undefined || node === false) return;

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (
      typeof node === "string" ||
      typeof node === "number" ||
      typeof node === "boolean"
    ) {
      return;
    }

    if (typeof node !== "object") return;

    const el = node as {
      type?: unknown;
      props?: {
        value?: unknown;
        children?: React.ReactNode;
      };
    };

    if (!el.props) return;

    /* ---- <option value="X">Label</option> ---- */
    if (el.type === "option" && el.props.value !== undefined) {
      const value = extractValue(el.props.value);
      if (!value) return;

      const label = extractLabel(el.props.children, value);
      result.push({ value, label: label || value });
      return;
    }

    /* ---- Recurse ---- */
    if (el.props.children) {
      walk(el.props.children);
    }
  };

  walk(children);
  return result;
}

/* ============================================================
 * NativeSelect — Shadcn Wrapper (Drop-in for native select)
 * ============================================================ */
interface NativeSelectProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  children: React.ReactNode;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

export function NativeSelect({
  id,
  name: _name,
  value,
  defaultValue,
  disabled,
  placeholder = "Select...",
  className,
  children,
  onChange,
  onBlur,
}: NativeSelectProps) {
  const options = React.useMemo(() => extractOptions(children), [children]);

  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={(val) => {
        onChange?.(String(val));
      }}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className={cn("h-10 w-full rounded-lg", className)}
        onBlur={onBlur}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[320px]">
        {options.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            No options
          </div>
        ) : (
          options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

/* ============================================================
 * Stat Card
 * ============================================================ */
export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}