/*
  Warnings:

  - A unique constraint covering the columns `[mlModelId]` on the table `ml_models` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ml_models" ADD COLUMN     "mlModelId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ml_models_mlModelId_key" ON "ml_models"("mlModelId");
