"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

import { QueryProvider } from "@/components/providers/query-provider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="fraudly-theme"
    >
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}