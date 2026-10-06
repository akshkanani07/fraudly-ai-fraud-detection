import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailContent } from "@/features/auth/components/verify-email-content";

export const metadata: Metadata = {
  title: "Verify Email | Fraudly",
  description:
    "Verify your email address to activate your Fraudly account.",
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailSkeleton />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailSkeleton() {
  return (
    <div className="w-full max-w-md animate-pulse space-y-4 rounded-2xl border border-border/60 bg-card/60 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mx-auto h-12 w-12 rounded-full bg-muted" />
      <div className="mx-auto h-6 w-48 rounded bg-muted" />
      <div className="mx-auto h-4 w-64 rounded bg-muted" />
      <div className="h-10 w-full rounded bg-muted" />
    </div>
  );
}