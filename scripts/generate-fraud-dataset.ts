/**
 * Generate Synthetic Fraud Dataset for Training
 * Run: npx tsx scripts/generate-fraud-dataset.ts
 */

import fs from "node:fs";
import path from "node:path";

/* ============================================================
 * Configuration
 * ============================================================ */
const TOTAL_ROWS = 2000;
const FRAUD_RATIO = 0.3; // 30% fraud — for balanced training

/* ============================================================
 * Data Pools
 * ============================================================ */
const MERCHANTS_LEGIT = [
  "Amazon",
  "Apple Store",
  "Netflix",
  "Uber",
  "Starbucks",
  "Walmart",
  "Target",
  "Best Buy",
  "Airbnb",
  "Spotify",
  "eBay",
  "Local Grocery",
  "Shell Gas",
  "DoorDash",
];

const MERCHANTS_FRAUD = [
  "Unknown Merchant",
  "Crypto Exchange X",
  "Anonymous Wallet",
  "Offshore Casinos",
  "Suspicious Store",
];

const CATEGORIES_LEGIT = [
  "Retail",
  "Food",
  "Travel",
  "Entertainment",
  "Fuel",
  "Electronics",
  "Groceries",
];

const CATEGORIES_FRAUD = ["Crypto", "Gaming", "Transfer"];

const COUNTRIES_LEGIT = ["US", "GB", "IN", "DE", "FR", "CA", "AU", "JP"];

const COUNTRIES_FRAUD = ["RU", "NG", "CN", "BR"];

const CHANNELS = ["ONLINE", "POS", "ATM", "MOBILE", "TRANSFER"];

/* ============================================================
 * Helpers
 * ============================================================ */
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function csvEscape(value: unknown): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/* ============================================================
 * Generate
 * ============================================================ */
function generate() {
  const headers = [
    "amount",
    "merchant",
    "category",
    "channel",
    "country",
    "customer_id",
    "device_id",
    "hour_of_day",
    "day_of_week",
    "distance_from_home_km",
    "is_new_merchant",
    "transactions_last_24h",
    "is_fraud",
  ];

  const fraudCount = Math.floor(TOTAL_ROWS * FRAUD_RATIO);
  const legitCount = TOTAL_ROWS - fraudCount;

  const rows: string[] = [];

  /* ---- Generate Fraud Rows ---- */
  for (let i = 0; i < fraudCount; i++) {
    const amount = rand(2000, 20000);
    const hour = randInt(0, 5); // Late night
    const distance = randInt(500, 5000);
    const txLast24h = randInt(8, 30);

    rows.push(
      [
        amount.toFixed(2),
        pick(MERCHANTS_FRAUD),
        pick(CATEGORIES_FRAUD),
        pick(CHANNELS),
        pick(COUNTRIES_FRAUD),
        `CUST-${randInt(1000, 9999)}`,
        `DEV-${randInt(10000, 99999)}`,
        hour,
        randInt(0, 6),
        distance,
        1, // is_new_merchant
        txLast24h,
        1, // is_fraud
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  /* ---- Generate Legit Rows ---- */
  for (let i = 0; i < legitCount; i++) {
    const amount = rand(5, 800);
    const hour = randInt(7, 22); // Daytime
    const distance = randInt(1, 50);
    const txLast24h = randInt(1, 6);

    rows.push(
      [
        amount.toFixed(2),
        pick(MERCHANTS_LEGIT),
        pick(CATEGORIES_LEGIT),
        pick(CHANNELS),
        pick(COUNTRIES_LEGIT),
        `CUST-${randInt(1000, 9999)}`,
        `DEV-${randInt(10000, 99999)}`,
        hour,
        randInt(0, 6),
        distance,
        0, // is_new_merchant
        txLast24h,
        0, // is_fraud
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  /* ---- Shuffle ---- */
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  /* ---- Write File ---- */
  const csv = [headers.join(","), ...rows].join("\n");
  const outDir = path.resolve(process.cwd(), "sample-data");
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "fraud-dataset-2000.csv");
  fs.writeFileSync(outFile, csv, "utf-8");

  console.log("═".repeat(60));
  console.log("✨ Dataset Generated Successfully!");
  console.log("═".repeat(60));
  console.log(`📁 File:      ${outFile}`);
  console.log(`📊 Total:     ${TOTAL_ROWS} rows`);
  console.log(`🚨 Fraud:     ${fraudCount} rows (${(FRAUD_RATIO * 100).toFixed(0)}%)`);
  console.log(`✅ Legit:     ${legitCount} rows (${((1 - FRAUD_RATIO) * 100).toFixed(0)}%)`);
  console.log(`📋 Features:  ${headers.length - 1}`);
  console.log("═".repeat(60));
  console.log("\n👉 Upload this file in Train Model Dialog");
  console.log(`   Target column: is_fraud`);
  console.log(`   Fraud value:   1\n`);
}

generate();