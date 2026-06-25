-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('CASHFLOWS', 'STRIPE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'PROCESSING_FAILED');

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "orderNumber" TEXT NOT NULL,
    "providerPaymentJobReference" TEXT,
    "providerPaymentReference" TEXT,
    "providerActionUrl" TEXT,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "locale" TEXT,
    "rawCreateResponse" JSONB,
    "rawLastStatusResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "entries" ADD COLUMN "paymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderNumber_key" ON "payments"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerPaymentJobReference_key" ON "payments"("providerPaymentJobReference");

-- CreateIndex
CREATE INDEX "payments_provider_status_idx" ON "payments"("provider", "status");

-- CreateIndex
CREATE INDEX "payments_competitionId_idx" ON "payments"("competitionId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "entries_paymentId_idx" ON "entries"("paymentId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
