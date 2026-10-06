import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password | Fraudly",
  description: "Set a new password for your Fraudly account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordSkeleton() {
  return (
    <div className="w-full max-w-md animate-pulse space-y-4 rounded-2xl border border-border/60 bg-card/60 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mx-auto h-6 w-48 rounded bg-muted" />
      <div className="mx-auto h-4 w-64 rounded bg-muted" />
      <div className="space-y-3 pt-4">
        <div className="h-10 w-full rounded bg-muted" />
        <div className="h-10 w-full rounded bg-muted" />
        <div className="h-11 w-full rounded bg-muted" />
      </div>
    </div>
  );
}