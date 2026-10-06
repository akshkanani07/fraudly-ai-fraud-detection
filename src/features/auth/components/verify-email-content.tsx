"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { sendVerificationEmail } from "@/lib/auth/auth-client";
import { AuthCard, AuthCardHeader } from "./auth-form-parts";

export function VerifyEmailContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  const onResend = async () => {
    if (!email) {
      toast.error(
        "Email address is missing. Please register again or contact support.",
      );
      return;
    }

    setIsResending(true);
    try {
      const { error } = await sendVerificationEmail({
        email,
        callbackURL: "/dashboard",
      });

      if (error) {
        toast.error(error.message ?? "Failed to resend verification email.");
        return;
      }

      setResent(true);
      toast.success("Verification email sent. Please check your inbox.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          {resent ? (
            <CheckCircle2 className="h-7 w-7" />
          ) : (
            <Mail className="h-7 w-7" />
          )}
        </div>

        <AuthCardHeader
          title="Check your inbox"
          description={
            email
              ? `We've sent a verification link to ${email}. Click it to activate your account.`
              : "We've sent you a verification link. Click it to activate your account."
          }
        />

        <div className="mt-2 w-full space-y-3">
          <Button
            onClick={onResend}
            disabled={isResending || !email}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend verification email
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button
              type="button"
              onClick={onResend}
              disabled={isResending || !email}
              className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
            >
              resend it
            </button>
            .
          </p>

          <p className="pt-2 text-sm text-muted-foreground">
            Wrong email?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Register again
            </Link>
          </p>
        </div>
      </div>
    </AuthCard>
  );
}