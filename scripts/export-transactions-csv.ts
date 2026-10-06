import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function exportToCsv() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { transactedAt: "desc" },
  });

  if (transactions.length === 0) {
    console.error("❌ No transactions found");
    process.exit(1);
  }

  /* CSV Header */
  const headers = [
    "amount",
    "merchant",
    "category",
    "channel",
    "country",
    "customer_id",
    "device_id",
    "hour",
    "day_of_week",
    "is_fraud",
  ];

  /* CSV Rows */
  const rows = transactions.map((tx) => {
    const date = new Date(tx.transactedAt);
    return [
      Number(tx.amount),
      tx.merchant ?? "",
      tx.category ?? "",
      tx.channel,
      tx.country ?? "",
      tx.customerId ?? "",
      tx.deviceId ?? "",
      date.getHours(),
      date.getDay(),
      tx.isFraudLabel ? 1 : 0,
    ]
      .map((v) => {
        const s = String(v);
        return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  /* Write */
  const outDir = path.resolve(process.cwd(), "sample-data");
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "transactions.csv");
  fs.writeFileSync(outFile, csv, "utf-8");

  console.log(`✅ Exported ${transactions.length} rows → ${outFile}`);
  console.log(`   Fraud rows: ${transactions.filter((t) => t.isFraudLabel).length}`);
  console.log(`   Legit rows: ${transactions.filter((t) => !t.isFraudLabel).length}`);
}

exportToCsv()
  .catch(console.error)
  .finally(() => prisma.$disconnect());