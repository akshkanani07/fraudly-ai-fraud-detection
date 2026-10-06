import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Create Account | Fraudly",
  description:
    "Create your Fraudly account and start detecting fraud with enterprise-grade AI.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}