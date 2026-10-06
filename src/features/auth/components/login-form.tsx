"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signIn } from "@/lib/auth/auth-client";
import {
  loginSchema,
  type LoginInput,
} from "@/features/auth/schemas/auth.schemas";
import {
  AuthCard,
  AuthCardHeader,
  AuthFieldError,
  AuthInputWrapper,
  AuthDivider,
} from "@/features/auth/components/auth-form-parts";

const DEFAULT_REDIRECT = "/dashboard";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? DEFAULT_REDIRECT;

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const onSubmit = async (values: LoginInput) => {
    setIsLoading(true);
    try {
      const { error } = await signIn.email({
        email: values.email,
        password: values.password,
        rememberMe,
        callbackURL: redirectTo,
      });

      if (error) {
        /* Email not verified case */
        if (
          error.message?.toLowerCase().includes("verify") ||
          error.message?.toLowerCase().includes("verification")
        ) {
          toast.error("Please verify your email before signing in.");
          router.push(
            `/verify-email?email=${encodeURIComponent(values.email)}`,
          );
          return;
        }

        toast.error(error.message ?? "Invalid email or password.");
        return;
      }

      toast.success("Welcome back!");
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------
   * Magic Link Handler
   * ------------------------------------------------------------ */
  const onMagicLink = () => {
    router.push("/magic-link");
  };

  /* ------------------------------------------------------------
   * Render
   * ------------------------------------------------------------ */
  return (
    <AuthCard>
      <AuthCardHeader
        title="Welcome back"
        description="Sign in to your Fraudly account to continue"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
              autoFocus
              {...register("email")}
            />
          </AuthInputWrapper>
          <AuthFieldError message={errors.email?.message} />
        </div>

        {/* ---------- Password ---------- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
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
                  <EyeOffIcon />
                ) : (
                  <EyeIcon />
                )}
              </button>
            }
          >
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="pl-9 pr-10"
              disabled={isLoading}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
          </AuthInputWrapper>
          <AuthFieldError message={errors.password?.message} />
        </div>

        {/* ---------- Remember Me ---------- */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={isLoading}
          />
          <Label
            htmlFor="rememberMe"
            className="cursor-pointer text-sm font-normal text-muted-foreground"
          >
            Remember me for 30 days
          </Label>
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
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* ---------- Magic Link Divider ---------- */}
        <AuthDivider label="OR" />

        {/* ---------- Magic Link Button ---------- */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          size="lg"
          disabled={isLoading}
          onClick={onMagicLink}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Sign in with Magic Link
        </Button>

        {/* ---------- Footer ---------- */}
        <p className="pt-2 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create account
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

/* ============================================================
 * Inline Icons
 * ============================================================ */
function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}