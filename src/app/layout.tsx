import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/providers/app-providers";
import { clientEnv } from "@/config/env";

import "./globals.css";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const appName = clientEnv.NEXT_PUBLIC_APP_NAME;

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
  applicationName: appName,
  title: {
    default: `${appName} | Enterprise AI Fraud Detection`,
    template: `%s | ${appName}`,
  },
  description:
    "Enterprise AI-powered fraud detection platform for real-time transaction monitoring, risk scoring and explainable predictions.",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a12" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}