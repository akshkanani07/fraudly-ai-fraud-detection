"use client";

import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

/* ============================================================
 * AuthCard — Wrapper
 * ============================================================ */
interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl border border-border/60 bg-card/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ============================================================
 * AuthCardHeader
 * ============================================================ */
interface AuthCardHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function AuthCardHeader({
  title,
  description,
  className,
}: AuthCardHeaderProps) {
  return (
    <div className={cn("mb-6 space-y-1.5 text-center", className)}>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/* ============================================================
 * AuthInputWrapper — Icon + Input + Trailing
 *
 * IMPORTANT: Icon must be passed as JSX Element (દા.ત. <Mail />)
 * NOT as Component (દા.ત. Mail)
 * ============================================================ */
interface AuthInputWrapperProps {
  children: ReactNode;
  icon?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function AuthInputWrapper({
  children,
  icon,
  trailing,
  className,
}: AuthInputWrapperProps) {
  return (
    <div className={cn("relative", className)}>
      {icon ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 z-10 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-muted-foreground [&>svg]:h-4 [&>svg]:w-4"
        >
          {icon}
        </span>
      ) : null}

      {children}

      {trailing ? (
        <span className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center">
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

/* ============================================================
 * AuthFieldError / FormFieldError
 * ============================================================ */
interface AuthFieldErrorProps {
  message?: string;
  className?: string;
}

export function AuthFieldError({ message, className }: AuthFieldErrorProps) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className={cn("text-xs font-medium text-destructive", className)}
    >
      {message}
    </p>
  );
}

export const FormFieldError = AuthFieldError;

/* ============================================================
 * FormAlert / AuthAlert
 * ============================================================ */
interface FormAlertProps {
  variant?: "default" | "destructive" | "success" | "warning";
  title?: string;
  children: ReactNode;
  className?: string;
}

export function FormAlert({
  variant = "default",
  title,
  children,
  className,
}: FormAlertProps) {
  const variantClass: Record<NonNullable<FormAlertProps["variant"]>, string> = {
    default: "",
    destructive:
      "border-destructive/40 bg-destructive/10 text-destructive [&>svg]:text-destructive",
    success:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 [&>svg]:text-emerald-600",
    warning:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 [&>svg]:text-amber-600",
  };

  return (
    <Alert
      variant={variant === "destructive" ? "destructive" : "default"}
      className={cn(variantClass[variant], className)}
    >
      {title ? <div className="font-medium">{title}</div> : null}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

export const AuthAlert = FormAlert;

/* ============================================================
 * AuthDivider
 * ============================================================ */
interface AuthDividerProps {
  label?: string;
  className?: string;
}

export function AuthDivider({ label = "OR", className }: AuthDividerProps) {
  return (
    <div className={cn("relative my-4", className)}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-3 tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
 * FormField
 * ============================================================ */
interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? (
        <AuthFieldError message={error} />
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* ============================================================
 * IconInput — Input with Left Icon
 *
 * Usage:
 *   <IconInput icon={<Mail className="h-4 w-4" />} {...register("email")} />
 * ============================================================ */
interface IconInputProps extends ComponentProps<typeof Input> {
  icon?: ReactNode;
  trailing?: ReactNode;
}

export function IconInput({
  icon,
  trailing,
  className,
  ...props
}: IconInputProps) {
  return (
    <AuthInputWrapper icon={icon} trailing={trailing}>
      <Input
        className={cn(icon && "pl-9", trailing && "pr-10", className)}
        {...props}
      />
    </AuthInputWrapper>
  );
}

/* ============================================================
 * PasswordInput — Input with Show/Hide Toggle
 * ============================================================ */
interface PasswordInputProps extends ComponentProps<typeof Input> {
  icon?: ReactNode;
  visible: boolean;
  onToggle: () => void;
}

export function PasswordInput({
  icon,
  visible,
  onToggle,
  className,
  ...props
}: PasswordInputProps) {
  return (
    <AuthInputWrapper
      icon={icon}
      trailing={
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    >
      <Input
        type={visible ? "text" : "password"}
        className={cn("pl-9 pr-10", className)}
        {...props}
      />
    </AuthInputWrapper>
  );
}

/* ============================================================
 * SubmitButton
 * ============================================================ */
interface SubmitButtonProps extends ComponentProps<typeof Button> {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function SubmitButton({
  isLoading,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      className={cn("w-full", className)}
      disabled={isLoading || disabled}
      size="lg"
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText ?? "Please wait..."}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/* ============================================================
 * AuthFooterLink
 * ============================================================ */
interface AuthFooterLinkProps {
  text: string;
  linkText: string;
  href: string;
  className?: string;
}

export function AuthFooterLink({
  text,
  linkText,
  href,
  className,
}: AuthFooterLinkProps) {
  return (
    <p className={cn("text-center text-sm text-muted-foreground", className)}>
      {text}{" "}
      <Link
        href={href}
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {linkText}
      </Link>
    </p>
  );
}

/* ============================================================
 * AuthPasswordToggle — Standalone Toggle
 * ============================================================ */
interface AuthPasswordToggleProps {
  visible: boolean;
  onToggle: () => void;
}

export function AuthPasswordToggle({
  visible,
  onToggle,
}: AuthPasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-muted-foreground transition-colors hover:text-foreground"
      aria-label={visible ? "Hide password" : "Show password"}
      tabIndex={-1}
    >
      {visible ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}

/* ============================================================
 * Inline SVG Icons (No Extra Deps)
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