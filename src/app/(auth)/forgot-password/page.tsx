import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password | Fraudly",
  description:
    "Reset your Fraudly password. We'll send you a secure link to set a new one.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}