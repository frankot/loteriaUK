-- AlterTable
ALTER TABLE "entries" ADD COLUMN     "stripeSessionId" TEXT;

-- CreateIndex
CREATE INDEX "entries_stripeSessionId_idx" ON "entries"("stripeSessionId");
