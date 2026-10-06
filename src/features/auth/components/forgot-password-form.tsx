"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgetPassword } from "@/lib/auth/auth-client";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/schemas/auth.schemas";
import {
  AuthCard,
  AuthCardHeader,
  AuthFieldError,
  AuthInputWrapper,
} from "@/features/auth/components/auth-form-parts";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      const { error } = await forgetPassword({
        email: values.email,
        redirectTo: "/reset-password",
      });

      if (error) {
        toast.error(
          error.message ??
            "We couldn't send the reset link. Please try again.",
        );
        return;
      }

      setSentTo(values.email);
      setIsSuccess(true);
      toast.success("Password reset link sent. Check your inbox.");
    } catch {
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------
   * Success State
   * ------------------------------------------------------------ */
  if (isSuccess) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <AuthCardHeader
            title="Check your inbox"
            description={`We've sent a password reset link to ${sentTo}. Click it to set a new password.`}
          />

          <div className="mt-2 w-full space-y-3">
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive the email? Check your spam folder or wait a
              few minutes.
            </p>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => {
                setIsSuccess(false);
                setSentTo("");
              }}
            >
              Try another email
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  /* ------------------------------------------------------------
   * Form State
   * ------------------------------------------------------------ */
  return (
    <AuthCard>
      <AuthCardHeader
        title="Forgot your password?"
        description="Enter your email and we'll send you a link to reset it."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <AuthInputWrapper icon={<Mail className="h-4 w-4" />}>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className="pl-9"
              disabled={isLoading}
              aria-invalid={!!errors.email}
              autoFocus
              {...register("email")}
            />
          </AuthInputWrapper>
          <AuthFieldError message={errors.email?.message} />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 pt-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </form>
    </AuthCard>
  );
}