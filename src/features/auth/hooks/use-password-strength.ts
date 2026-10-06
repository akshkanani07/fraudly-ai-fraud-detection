"use client";

import { useMemo } from "react";

export type PasswordStrengthLevel = "weak" | "fair" | "good" | "strong";

export interface PasswordStrengthChecks {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

export interface PasswordStrengthResult {
  score: number;
  level: PasswordStrengthLevel;
  label: string;
  colorClass: string;
  barWidthPercent: number;
  checks: PasswordStrengthChecks;
}

export function usePasswordStrength(
  password: string,
): PasswordStrengthResult {
  return useMemo<PasswordStrengthResult>(() => {
    const checks: PasswordStrengthChecks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const isLongEnough = password.length >= 12;

    let level: PasswordStrengthLevel = "weak";
    let label = "Weak";
    let colorClass = "bg-red-500";

    if (score === 5 && isLongEnough) {
      level = "strong";
      label = "Strong";
      colorClass = "bg-emerald-500";
    } else if (score >= 4) {
      level = "good";
      label = "Good";
      colorClass = "bg-blue-500";
    } else if (score >= 3) {
      level = "fair";
      label = "Fair";
      colorClass = "bg-amber-500";
    }

    return {
      score,
      level,
      label,
      colorClass,
      barWidthPercent: (score / 5) * 100,
      checks,
    };
  }, [password]);
}