"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Loader2, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/auth-client";
import {
  magicLinkSchema,
  type MagicLinkInput,
} from "@/features/auth/schemas/auth.schemas";
import {
  AuthCard,
  AuthCardHeader,
  AuthFieldError,
  AuthInputWrapper,
} from "@/features/auth/components/auth-form-parts";

export function MagicLinkForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MagicLinkInput>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: MagicLinkInput) => {
    setIsLoading(true);
    try {
      const { error } = await signIn.magicLink({
        email: values.email,
        callbackURL: "/dashboard",
      });

      if (error) {
        toast.error(
          error.message ?? "We couldn't send the magic link. Please try again.",
        );
        return;
      }

      setSentTo(values.email);
      setIsSuccess(true);
      toast.success("Magic link sent! Check your inbox.");
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
            description={`We've sent a magic sign-in link to ${sentTo}. Click it to sign in instantly — no password needed.`}
          />

          <div className="mt-2 w-full space-y-3">
            <p className="text-xs text-muted-foreground">
              The link expires in 10 minutes. Check your spam folder if you
              don&apos;t see it.
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
        title="Sign in with Magic Link"
        description="Enter your email and we'll send you a secure sign-in link. No password needed."
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
              Sending magic link...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Send magic link
            </>
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