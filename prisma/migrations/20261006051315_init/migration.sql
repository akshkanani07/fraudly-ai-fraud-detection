-- CreateEnum
CREATE TYPE "DatasetStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'CLEANED', 'FAILED');

-- CreateEnum
CREATE TYPE "MlAlgorithm" AS ENUM ('LOGISTIC_REGRESSION', 'RANDOM_FOREST', 'XGBOOST');

-- CreateEnum
CREATE TYPE "MlModelStatus" AS ENUM ('TRAINING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'FLAGGED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TransactionChannel" AS ENUM ('ONLINE', 'POS', 'ATM', 'MOBILE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('FRAUD_SUMMARY', 'TRANSACTION_REPORT', 'MODEL_PERFORMANCE', 'AUDIT_REPORT');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'CSV', 'XLSX');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FRAUD_ALERT', 'MODEL_TRAINED', 'DATASET_PROCESSED', 'REPORT_READY', 'SECURITY', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "impersonatedBy" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datasets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "filePublicId" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "rowCount" INTEGER,
    "columnCount" INTEGER,
    "columns" JSONB,
    "targetColumn" TEXT,
    "status" "DatasetStatus" NOT NULL DEFAULT 'UPLOADED',
    "processingError" TEXT,
    "cleaningSummary" JSONB,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "algorithm" "MlAlgorithm" NOT NULL,
    "status" "MlModelStatus" NOT NULL DEFAULT 'TRAINING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "datasetId" TEXT,
    "trainedById" TEXT,
    "hyperparameters" JSONB,
    "featureColumns" JSONB,
    "featureImportance" JSONB,
    "trainingRows" INTEGER,
    "accuracy" DOUBLE PRECISION,
    "precision" DOUBLE PRECISION,
    "recall" DOUBLE PRECISION,
    "f1Score" DOUBLE PRECISION,
    "rocAuc" DOUBLE PRECISION,
    "confusionMatrix" JSONB,
    "artifactPath" TEXT,
    "trainingError" TEXT,
    "trainingStartedAt" TIMESTAMP(3),
    "trainedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "merchant" TEXT,
    "category" TEXT,
    "channel" "TransactionChannel" NOT NULL DEFAULT 'ONLINE',
    "customerId" TEXT,
    "deviceId" TEXT,
    "ipAddress" TEXT,
    "country" VARCHAR(2),
    "features" JSONB,
    "isFraudLabel" BOOLEAN,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "transactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "datasetId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "isFraud" BOOLEAN NOT NULL,
    "fraudProbability" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "explanation" JSONB,
    "latencyMs" INTEGER,
    "requestedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL DEFAULT 'PDF',
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "parameters" JSONB,
    "fileUrl" TEXT,
    "filePublicId" TEXT,
    "errorMessage" TEXT,
    "generatedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_providerId_accountId_key" ON "accounts"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "verifications_expiresAt_idx" ON "verifications"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "datasets_filePublicId_key" ON "datasets"("filePublicId");

-- CreateIndex
CREATE INDEX "datasets_status_idx" ON "datasets"("status");

-- CreateIndex
CREATE INDEX "datasets_uploadedById_idx" ON "datasets"("uploadedById");

-- CreateIndex
CREATE INDEX "datasets_createdAt_idx" ON "datasets"("createdAt");

-- CreateIndex
CREATE INDEX "ml_models_status_idx" ON "ml_models"("status");

-- CreateIndex
CREATE INDEX "ml_models_isActive_idx" ON "ml_models"("isActive");

-- CreateIndex
CREATE INDEX "ml_models_algorithm_idx" ON "ml_models"("algorithm");

-- CreateIndex
CREATE INDEX "ml_models_datasetId_idx" ON "ml_models"("datasetId");

-- CreateIndex
CREATE INDEX "ml_models_createdAt_idx" ON "ml_models"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ml_models_name_version_key" ON "ml_models"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_externalId_key" ON "transactions"("externalId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_transactedAt_idx" ON "transactions"("transactedAt");

-- CreateIndex
CREATE INDEX "transactions_customerId_idx" ON "transactions"("customerId");

-- CreateIndex
CREATE INDEX "transactions_merchant_idx" ON "transactions"("merchant");

-- CreateIndex
CREATE INDEX "transactions_datasetId_idx" ON "transactions"("datasetId");

-- CreateIndex
CREATE INDEX "transactions_createdById_idx" ON "transactions"("createdById");

-- CreateIndex
CREATE INDEX "transactions_status_transactedAt_idx" ON "transactions"("status", "transactedAt");

-- CreateIndex
CREATE INDEX "predictions_transactionId_idx" ON "predictions"("transactionId");

-- CreateIndex
CREATE INDEX "predictions_modelId_idx" ON "predictions"("modelId");

-- CreateIndex
CREATE INDEX "predictions_isFraud_idx" ON "predictions"("isFraud");

-- CreateIndex
CREATE INDEX "predictions_riskLevel_idx" ON "predictions"("riskLevel");

-- CreateIndex
CREATE INDEX "predictions_createdAt_idx" ON "predictions"("createdAt");

-- CreateIndex
CREATE INDEX "predictions_requestedById_idx" ON "predictions"("requestedById");

-- CreateIndex
CREATE INDEX "reports_type_idx" ON "reports"("type");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_generatedById_idx" ON "reports"("generatedById");

-- CreateIndex
CREATE INDEX "reports_createdAt_idx" ON "reports"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_models" ADD CONSTRAINT "ml_models_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ml_models" ADD CONSTRAINT "ml_models_trainedById_fkey" FOREIGN KEY ("trainedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ml_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
