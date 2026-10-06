import type { Metadata } from "next";
import { TransactionsPageClient } from "@/features/transactions/components/transactions-page-client";

export const metadata: Metadata = {
  title: "Transactions | Fraudly",
  description:
    "Monitor, filter, and manage all fraud detection transactions in real-time.",
};

export default function TransactionsPage() {
  return <TransactionsPageClient />;
}