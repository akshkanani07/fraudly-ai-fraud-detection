/**
 * Fraudly — Database Seed Script
 *
 * Usage:
 *   npm run db:seed
 */

/* ============================================================
 * Env Loading — MUST be first!
 * ============================================================ */
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

/* ============================================================
 * Imports
 * ============================================================ */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/* ============================================================
 * Validate DATABASE_URL
 * ============================================================ */
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set!");
  console.error("   Check .env.local file in project root.");
  process.exit(1);
}

/* ============================================================
 * Prisma Client (Adapter for Prisma 7)
 * ============================================================ */
const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

/* ============================================================
 * Helpers
 * ============================================================ */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function randomDate(daysBack = 30): Date {
  const now = Date.now();
  const past = now - daysBack * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

/* ============================================================
 * Sample Data Pools
 * ============================================================ */
const MERCHANTS = [
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
  "Steam Games",
  "eBay",
  "Alibaba",
  "Binance Exchange",
  "Crypto.com",
  "Local Grocery",
  "Shell Gas",
  "Delta Airlines",
  "Booking.com",
  "DoorDash",
];

const CATEGORIES = [
  "Retail",
  "Food & Dining",
  "Travel",
  "Entertainment",
  "Fuel",
  "Electronics",
  "Crypto",
  "Gaming",
  "Groceries",
  "Utilities",
];

const COUNTRIES = [
  "US",
  "GB",
  "IN",
  "DE",
  "FR",
  "CA",
  "AU",
  "JP",
  "BR",
  "RU",
  "NG",
  "CN",
];

const HIGH_RISK_COUNTRIES = ["RU", "NG", "CN", "BR"];

const CHANNELS = ["ONLINE", "POS", "ATM", "MOBILE", "TRANSFER"] as const;

const CURRENCIES = ["USD", "EUR", "GBP", "INR"];

const FRAUD_MERCHANTS = [
  "Unknown Merchant",
  "Crypto Exchange X",
  "Offshore Casinos",
  "Anonymous Wallet",
  "Suspicious Store",
];

/* ============================================================
 * ML Models (Synthetic)
 * ============================================================ */
const ML_MODELS = [
  {
    name: "FraudDetector-LR",
    version: 1,
    algorithm: "LOGISTIC_REGRESSION" as const,
    isActive: false,
    accuracy: 0.892,
    precision: 0.845,
    recall: 0.821,
    f1Score: 0.833,
    rocAuc: 0.913,
    hyperparameters: { C: 1.0, max_iter: 1000, solver: "lbfgs" },
    featureImportance: [
      { feature: "amount", importance: 0.32 },
      { feature: "merchantRisk", importance: 0.28 },
      { feature: "country", importance: 0.18 },
      { feature: "hour", importance: 0.12 },
      { feature: "deviceId", importance: 0.1 },
    ],
    trainingRows: 284807,
    confusionMatrix: {
      truePositive: 421,
      falsePositive: 78,
      trueNegative: 56850,
      falseNegative: 92,
    },
  },
  {
    name: "FraudDetector-RF",
    version: 1,
    algorithm: "RANDOM_FOREST" as const,
    isActive: true,
    accuracy: 0.941,
    precision: 0.912,
    recall: 0.889,
    f1Score: 0.9,
    rocAuc: 0.967,
    hyperparameters: { n_estimators: 200, max_depth: 20, min_samples_split: 5 },
    featureImportance: [
      { feature: "amount", importance: 0.35 },
      { feature: "merchantRisk", importance: 0.31 },
      { feature: "country", importance: 0.16 },
      { feature: "hour", importance: 0.11 },
      { feature: "deviceId", importance: 0.07 },
    ],
    trainingRows: 284807,
    confusionMatrix: {
      truePositive: 456,
      falsePositive: 44,
      trueNegative: 56884,
      falseNegative: 57,
    },
  },
  {
    name: "FraudDetector-XGB",
    version: 1,
    algorithm: "XGBOOST" as const,
    isActive: false,
    accuracy: 0.963,
    precision: 0.938,
    recall: 0.921,
    f1Score: 0.929,
    rocAuc: 0.981,
    hyperparameters: {
      n_estimators: 400,
      max_depth: 8,
      learning_rate: 0.05,
      subsample: 0.9,
    },
    featureImportance: [
      { feature: "amount", importance: 0.38 },
      { feature: "merchantRisk", importance: 0.29 },
      { feature: "country", importance: 0.14 },
      { feature: "hour", importance: 0.1 },
      { feature: "deviceId", importance: 0.09 },
    ],
    trainingRows: 284807,
    confusionMatrix: {
      truePositive: 472,
      falsePositive: 31,
      trueNegative: 56897,
      falseNegative: 41,
    },
  },
];

/* ============================================================
 * Main Seed
 * ============================================================ */
async function main() {
  console.log("🌱 Starting seed...\n");

  /* ---- 1. Clear Existing Data ---- */
  console.log("🧹 Clearing existing data...");
  await prisma.prediction.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.mlModel.deleteMany();
  await prisma.dataset.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  console.log("   ✅ Data cleared\n");

  /* ---- 2. Find Admin User ---- */
  const adminUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!adminUser) {
    console.log("⚠️  No user found. Please register a user first.");
    console.log("   Visit: http://localhost:3000/register");
    return;
  }

  console.log(`👤 Using user: ${adminUser.email}\n`);

  /* ---- 3. Dataset ---- */
  console.log("📊 Creating sample dataset...");
  const dataset = await prisma.dataset.create({
    data: {
      name: "Credit Card Fraud Detection 2026",
      description:
        "Synthetic credit card transactions dataset for fraud detection model training.",
      fileName: "creditcard_fraud_2026.csv",
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/sample.csv",
      filePublicId: `fraudly/datasets/creditcard_${Date.now()}`,
      fileSize: 15_489_234,
      rowCount: 284_807,
      columnCount: 31,
      columns: {
        Time: "float",
        V1: "float",
        V2: "float",
        V3: "float",
        Amount: "float",
        Class: "int",
      },
      targetColumn: "Class",
      status: "CLEANED",
      cleaningSummary: {
        missingValues: 0,
        duplicatesRemoved: 1081,
        outliers: 245,
      },
      uploadedById: adminUser.id,
    },
  });
  console.log(`   ✅ Dataset: ${dataset.name}\n`);

  /* ---- 4. ML Models ---- */
  console.log("🧠 Creating ML models...");
  const models = await Promise.all(
    ML_MODELS.map((m) =>
      prisma.mlModel.create({
        data: {
          name: m.name,
          version: m.version,
          algorithm: m.algorithm,
          status: "READY",
          isActive: m.isActive,
          datasetId: dataset.id,
          trainedById: adminUser.id,
          hyperparameters: m.hyperparameters,
          featureColumns: [
            "amount",
            "merchantRisk",
            "country",
            "hour",
            "deviceId",
          ],
          featureImportance: m.featureImportance,
          trainingRows: m.trainingRows,
          accuracy: m.accuracy,
          precision: m.precision,
          recall: m.recall,
          f1Score: m.f1Score,
          rocAuc: m.rocAuc,
          confusionMatrix: m.confusionMatrix,
          artifactPath: `models/${m.name.toLowerCase()}_v${m.version}.joblib`,
          trainingStartedAt: randomDate(10),
          trainedAt: randomDate(10),
        },
      }),
    ),
  );
  console.log(`   ✅ ${models.length} models created`);
  const activeModel = models.find((m) => m.isActive)!;
  console.log(`   🎯 Active model: ${activeModel.name}\n`);

  /* ---- 5. Transactions + Predictions ---- */
  const TOTAL_TRANSACTIONS = 120;
  console.log(`💰 Creating ${TOTAL_TRANSACTIONS} transactions...`);

  const FRAUD_COUNT = Math.floor(TOTAL_TRANSACTIONS * 0.2);

  for (let i = 0; i < TOTAL_TRANSACTIONS; i++) {
    const isFraud = i < FRAUD_COUNT;

    const amount = isFraud ? randFloat(500, 15000) : randFloat(5, 800);
    const merchant = isFraud ? pick(FRAUD_MERCHANTS) : pick(MERCHANTS);
    const country = isFraud ? pick(HIGH_RISK_COUNTRIES) : pick(COUNTRIES);
    const status = isFraud
      ? pick(["FLAGGED", "BLOCKED", "PENDING"] as const)
      : pick(["APPROVED", "PENDING"] as const);

    const transactedAt = randomDate(30);

    const transaction = await prisma.transaction.create({
      data: {
        externalId: `TXN-${Date.now()}-${i.toString().padStart(5, "0")}`,
        amount,
        currency: pick(CURRENCIES),
        merchant,
        category: isFraud
          ? pick(["Crypto", "Gaming", "Retail"])
          : pick(CATEGORIES),
        channel: pick([...CHANNELS]),
        customerId: `CUST-${randInt(1000, 9999)}`,
        deviceId: `DEV-${randInt(10000, 99999)}`,
        ipAddress: `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
        country,
        features: {
          hour: transactedAt.getHours(),
          dayOfWeek: transactedAt.getDay(),
          isWeekend: [0, 6].includes(transactedAt.getDay()),
          amountToAvgRatio: randFloat(0.5, 8),
          transactionsLast24h: randInt(1, 15),
          isNewMerchant: isFraud ? true : Math.random() > 0.7,
          hasDeviceFingerprint: isFraud ? Math.random() > 0.5 : true,
          distanceFromHomeKm: isFraud ? randInt(500, 5000) : randInt(1, 50),
        },
        isFraudLabel: isFraud,
        status,
        transactedAt,
        datasetId: dataset.id,
        createdById: adminUser.id,
      },
    });

    const fraudProb = isFraud
      ? randFloat(0.75, 0.99)
      : randFloat(0.01, 0.35);

    const confidence = randFloat(0.8, 0.98);

    const riskLevel = isFraud
      ? fraudProb >= 0.9
        ? ("CRITICAL" as const)
        : ("HIGH" as const)
      : fraudProb >= 0.3
        ? ("MEDIUM" as const)
        : ("LOW" as const);

    const modelsToUse =
      Math.random() > 0.85
        ? [activeModel, models[randInt(0, models.length - 1)]]
        : [activeModel];

    for (const model of modelsToUse) {
      const explanation = {
        baseValue: 0.15,
        contributions: [
          {
            feature: "amount",
            value: amount,
            impact: randFloat(0.15, 0.4),
            direction: "increases_fraud" as const,
          },
          {
            feature: "merchantRisk",
            value: merchant,
            impact: randFloat(0.1, 0.3),
            direction: isFraud
              ? ("increases_fraud" as const)
              : ("decreases_fraud" as const),
          },
          {
            feature: "country",
            value: country,
            impact: randFloat(0.05, 0.2),
            direction: HIGH_RISK_COUNTRIES.includes(country)
              ? ("increases_fraud" as const)
              : ("decreases_fraud" as const),
          },
          {
            feature: "hour",
            value: transactedAt.getHours(),
            impact: randFloat(0.02, 0.15),
            direction:
              transactedAt.getHours() < 6
                ? ("increases_fraud" as const)
                : ("decreases_fraud" as const),
          },
        ],
      };

      await prisma.prediction.create({
        data: {
          transactionId: transaction.id,
          modelId: model.id,
          isFraud,
          fraudProbability: fraudProb,
          confidence,
          riskLevel,
          explanation,
          latencyMs: randInt(20, 120),
          requestedById: adminUser.id,
        },
      });
    }
  }

  console.log(`   ✅ ${TOTAL_TRANSACTIONS} transactions created`);
  console.log(`   ✅ ~${TOTAL_TRANSACTIONS} predictions created\n`);

  /* ---- 6. Notifications ---- */
  console.log("🔔 Creating notifications...");
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        type: "FRAUD_ALERT",
        title: "High-risk transaction detected",
        message: `${FRAUD_COUNT} fraud transactions flagged in the last 30 days.`,
        data: { count: FRAUD_COUNT },
      },
      {
        userId: adminUser.id,
        type: "MODEL_TRAINED",
        title: "Model training complete",
        message: `${activeModel.name} v${activeModel.version} is now active with ${(activeModel.accuracy! * 100).toFixed(2)}% accuracy.`,
        data: { modelId: activeModel.id },
      },
      {
        userId: adminUser.id,
        type: "DATASET_PROCESSED",
        title: "Dataset cleaned",
        message: `${dataset.name} has been cleaned and is ready for training.`,
        data: { datasetId: dataset.id },
      },
      {
        userId: adminUser.id,
        type: "SYSTEM",
        title: "Welcome to Fraudly",
        message: "Your enterprise fraud detection platform is ready.",
      },
    ],
  });
  console.log("   ✅ 4 notifications created\n");

  /* ---- 7. Audit Logs ---- */
  console.log("📝 Creating audit logs...");
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: "SEED_RUN",
        entity: "System",
        entityId: "seed",
        metadata: { transactions: TOTAL_TRANSACTIONS, models: models.length },
      },
    ],
  });
  console.log("   ✅ Audit log created\n");

  /* ---- 8. System Settings ---- */
  console.log("⚙️  Creating system settings...");
  await prisma.systemSetting.createMany({
    data: [
      {
        key: "fraud_threshold",
        value: 0.75,
        description: "Fraud probability threshold for flagging",
        updatedById: adminUser.id,
      },
      {
        key: "auto_block_threshold",
        value: 0.9,
        description: "Auto-block threshold",
        updatedById: adminUser.id,
      },
      {
        key: "retrain_interval_days",
        value: 30,
        description: "Auto-retrain model every N days",
        updatedById: adminUser.id,
      },
    ],
  });
  console.log("   ✅ 3 system settings created\n");

  /* ---- Summary ---- */
  console.log("═".repeat(60));
  console.log("✨ Seed Complete!");
  console.log("═".repeat(60));
  console.log(`👤 User:          ${adminUser.email}`);
  console.log(`📊 Dataset:       1`);
  console.log(
    `🧠 ML Models:     ${models.length} (Active: ${activeModel.name})`,
  );
  console.log(`💰 Transactions:  ${TOTAL_TRANSACTIONS}`);
  console.log(`🔮 Predictions:   ~${TOTAL_TRANSACTIONS}`);
  console.log(`🔔 Notifications: 4`);
  console.log("═".repeat(60));
  console.log("\n👉 Visit: http://localhost:3000/transactions\n");
}

/* ============================================================
 * Execute
 * ============================================================ */
main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });