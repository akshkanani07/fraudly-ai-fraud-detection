import type { Metadata } from "next";
import { Suspense } from "react";
import { MagicLinkForm } from "@/features/auth/components/magic-link-form";

export const metadata: Metadata = {
  title: "Magic Link Sign In | Fraudly",
  description:
    "Sign in to Fraudly with a secure magic link. No password needed.",
};

export default function MagicLinkPage() {
  return (
    <Suspense fallback={<MagicLinkSkeleton />}>
      <MagicLinkForm />
    </Suspense>
  );
}

function MagicLinkSkeleton() {
  return (
    <div className="w-full max-w-md animate-pulse space-y-4 rounded-2xl border border-border/60 bg-card/60 p-8 shadow-2xl backdrop-blur-xl">
      <div className="mx-auto h-6 w-56 rounded bg-muted" />
      <div className="mx-auto h-4 w-72 rounded bg-muted" />
      <div className="space-y-3 pt-4">
        <div className="h-10 w-full rounded bg-muted" />
        <div className="h-11 w-full rounded bg-muted" />
      </div>
    </div>
  );
}