"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { signUp } from "@/lib/auth/auth-client";
import {
  registerSchema,
  type RegisterInput,
} from "@/features/auth/schemas/auth.schemas";
import { usePasswordStrength } from "@/features/auth/hooks/use-password-strength";
import { AuthCard, AuthCardHeader } from "@/features/auth/components/auth-form-parts";

interface AuthInputWrapperProps {
  icon?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}

function AuthInputWrapper({ icon, trailing, children }: AuthInputWrapperProps) {
  return (
    <div className="relative">
      {icon ? (
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
          {icon}
        </div>
      ) : null}
      {children}
      {trailing ? (
        <div className="absolute inset-y-0 right-3 flex items-center">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

function AuthFieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
    mode: "onBlur",
  });

  const password = watch("password");
  const acceptTerms = watch("acceptTerms");
  const strength = usePasswordStrength(password ?? "");

  const onSubmit = async (values: RegisterInput) => {
    setIsLoading(true);
    try {
      const { error } = await signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL: "/dashboard",
      });

      if (error) {
        toast.error(
          error.message ??
            "We couldn't create your account. Please try again.",
        );
        return;
      }

      toast.success(
        "Account created! Please check your inbox to verify your email.",
      );
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch {
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthCardHeader
        title="Create your account"
        description="Start detecting fraud with AI in under a minute"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* ---------- Name ---------- */}
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <AuthInputWrapper icon={<User className="h-4 w-4" />}>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              className="pl-9"
              disabled={isLoading}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </AuthInputWrapper>
          <AuthFieldError message={errors.name?.message} />
        </div>

        {/* ---------- Email ---------- */}
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
              {...register("email")}
            />
          </AuthInputWrapper>
          <AuthFieldError message={errors.email?.message} />
        </div>

        {/* ---------- Password ---------- */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
              placeholder="Create a strong password"
              autoComplete="new-password"
              className="pl-9 pr-10"
              disabled={isLoading}
              aria-invalid={!!errors.password}
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
                <Requirement
                  met={strength.checks.special}
                  label="Special"
                />
              </ul>
            </div>
          )}

          <AuthFieldError message={errors.password?.message} />
        </div>

        {/* ---------- Confirm Password ---------- */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
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
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className="pl-9 pr-10"
              disabled={isLoading}
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
          </AuthInputWrapper>
          <AuthFieldError message={errors.confirmPassword?.message} />
        </div>

        {/* ---------- Terms ---------- */}
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <Checkbox
              id="acceptTerms"
              checked={acceptTerms}
              onCheckedChange={(checked) =>
                setValue("acceptTerms", checked === true, {
                  shouldValidate: true,
                })
              }
              disabled={isLoading}
              className="mt-0.5"
            />
            <Label
              htmlFor="acceptTerms"
              className="cursor-pointer text-sm leading-snug font-normal text-muted-foreground"
            >
              I agree to the{" "}
              <Link
                href="/terms"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
            </Label>
          </div>
          <AuthFieldError message={errors.acceptTerms?.message} />
        </div>

        {/* ---------- Submit ---------- */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>

        {/* ---------- Footer ---------- */}
        <p className="pt-2 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
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