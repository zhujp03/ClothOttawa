-- AlterTable
ALTER TABLE "CustomerUser" ADD COLUMN "isSuspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CustomerUser" ADD COLUMN "suspendedAt" DATETIME;
ALTER TABLE "CustomerUser" ADD COLUMN "suspendedReason" TEXT;

-- CreateTable
CREATE TABLE "BlockedEmail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockedEmail_email_key" ON "BlockedEmail"("email");
CREATE INDEX "CustomerUser_isSuspended_idx" ON "CustomerUser"("isSuspended");
