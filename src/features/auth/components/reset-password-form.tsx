"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { resetPassword } from "@/lib/auth/auth-client";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/features/auth/schemas/auth.schemas";
import { usePasswordStrength } from "@/features/auth/hooks/use-password-strength";
import {
  AuthCard,
  AuthCardHeader,
  AuthFieldError,
  AuthInputWrapper,
} from "@/features/auth/components/auth-form-parts";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const password = useWatch({ control, name: "password" });
  const strength = usePasswordStrength(password ?? "");

  /* ------------------------------------------------------------
   * Missing / Invalid Token
   * ------------------------------------------------------------ */
  if (!token) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <AuthCardHeader
            title="Invalid reset link"
            description="This password reset link is missing or invalid. Please request a new one."
          />

          <div className="mt-2 w-full space-y-3">
            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={() => router.push("/forgot-password")}
            >
              Request new link
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
   * Success State
   * ------------------------------------------------------------ */
  if (isSuccess) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <AuthCardHeader
            title="Password updated"
            description="Your password has been reset successfully. Redirecting you to your dashboard..."
          />

          <div className="mt-2 w-full space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting...
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard now
            </Button>
          </div>
        </div>
      </AuthCard>
    );
  }

  /* ------------------------------------------------------------
   * Submit
   * ------------------------------------------------------------ */
  const onSubmit = async (values: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword({
        newPassword: values.password,
        token,
      });

      if (error) {
        toast.error(
          error.message ??
            "We couldn't reset your password. The link may have expired.",
        );
        return;
      }

      setIsSuccess(true);
      toast.success("Password reset successfully. Redirecting...");

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------
   * Form State
   * ------------------------------------------------------------ */
  return (
    <AuthCard>
      <AuthCardHeader
        title="Set a new password"
        description="Choose a strong password to secure your account."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* ---------- New Password ---------- */}
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <AuthInputWrapper
            icon={<Lock className="h-4 w-4" />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          >
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter a strong password"
              autoComplete="new-password"
              className="pl-9 pr-10"
              disabled={isLoading}
              aria-invalid={!!errors.password}
              autoFocus
              {...register("password")}
            />
          </AuthInputWrapper>

          {password && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Password strength
                </span>
                <span className="font-medium">{strength.label}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    strength.colorClass,
                  )}
                  style={{ width: `${strength.barWidthPercent}%` }}
                />
              </div>
              <ul className="grid grid-cols-2 gap-1.5 pt-1">
                <Requirement met={strength.checks.length} label="8+ chars" />
                <Requirement
                  met={strength.checks.uppercase}
                  label="Uppercase"
                />
                <Requirement
                  met={strength.checks.lowercase}
                  label="Lowercase"
                />
                <Requirement met={strength.checks.number} label="Number" />
                <Requirement met={strength.checks.special} label="Special" />
              </ul>
            </div>
          )}

          <AuthFieldError message={errors.password?.message} />
        </div>

        {/* ---------- Confirm Password ---------- */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <AuthInputWrapper
            icon={<Lock className="h-4 w-4" />}
            trailing={
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showConfirm ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          >
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              className="pl-9 pr-10"
              disabled={isLoading}
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
          </AuthInputWrapper>
          <AuthFieldError message={errors.confirmPassword?.message} />
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
              Updating password...
            </>
          ) : (
            "Update password"
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

/* ============================================================
 * Requirement Row
 * ============================================================ */
interface RequirementProps {
  met: boolean;
  label: string;
}

function Requirement({ met, label }: RequirementProps) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5 text-xs transition-colors",
        met ? "text-emerald-500" : "text-muted-foreground",
      )}
    >
      {met ? (
        <Check className="h-3 w-3 shrink-0" />
      ) : (
        <X className="h-3 w-3 shrink-0" />
      )}
      <span>{label}</span>
    </li>
  );
}