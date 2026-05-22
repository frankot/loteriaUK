-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'DRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('PAID', 'POSTAL');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('AVAILABLE', 'SOLD');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "ageConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_codes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "CompetitionStatus" NOT NULL DEFAULT 'DRAFT',
    "titleEn" TEXT NOT NULL,
    "titlePl" TEXT,
    "titleRo" TEXT,
    "titleBg" TEXT,
    "descEn" TEXT,
    "descPl" TEXT,
    "descRo" TEXT,
    "descBg" TEXT,
    "pricePounds" DECIMAL(10,2) NOT NULL,
    "maxTickets" INTEGER NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "prizeImageUrl" TEXT,
    "prizeCategory" TEXT,
    "prizeValue" DECIMAL(10,2),
    "ticketsSold" INTEGER NOT NULL DEFAULT 0,
    "questionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT,
    "number" INTEGER NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticketId" TEXT,
    "type" "EntryType" NOT NULL DEFAULT 'PAID',
    "answerCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "winners" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "winners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_questions" (
    "id" TEXT NOT NULL,
    "questionEn" TEXT NOT NULL,
    "questionPl" TEXT,
    "questionRo" TEXT,
    "questionBg" TEXT,
    "optionAEn" TEXT NOT NULL,
    "optionAPl" TEXT,
    "optionARo" TEXT,
    "optionABg" TEXT,
    "optionBEn" TEXT NOT NULL,
    "optionBPl" TEXT,
    "optionBRo" TEXT,
    "optionBBg" TEXT,
    "optionCEn" TEXT,
    "optionCPl" TEXT,
    "optionCRo" TEXT,
    "optionCBg" TEXT,
    "optionDEn" TEXT,
    "optionDPl" TEXT,
    "optionDRo" TEXT,
    "optionDBg" TEXT,
    "correctOption" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "login_codes_email_code_idx" ON "login_codes"("email", "code");

-- CreateIndex
CREATE UNIQUE INDEX "competitions_slug_key" ON "competitions"("slug");

-- CreateIndex
CREATE INDEX "competitions_status_drawDate_idx" ON "competitions"("status", "drawDate");

-- CreateIndex
CREATE INDEX "tickets_competitionId_status_idx" ON "tickets"("competitionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_competitionId_number_key" ON "tickets"("competitionId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "entries_ticketId_key" ON "entries"("ticketId");

-- CreateIndex
CREATE INDEX "entries_competitionId_idx" ON "entries"("competitionId");

-- CreateIndex
CREATE INDEX "entries_userId_idx" ON "entries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "winners_entryId_key" ON "winners"("entryId");

-- CreateIndex
CREATE INDEX "winners_competitionId_idx" ON "winners"("competitionId");

-- AddForeignKey
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "skill_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winners" ADD CONSTRAINT "winners_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winners" ADD CONSTRAINT "winners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winners" ADD CONSTRAINT "winners_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
