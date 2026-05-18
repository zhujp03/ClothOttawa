-- AlterTable
ALTER TABLE "CustomerUser" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CustomerUser" ADD COLUMN "emailVerifiedAt" DATETIME;
ALTER TABLE "CustomerUser" ADD COLUMN "emailVerifyTokenHash" TEXT;
ALTER TABLE "CustomerUser" ADD COLUMN "emailVerifyTokenExpiresAt" DATETIME;

-- CreateIndex
CREATE INDEX "CustomerUser_emailVerifyTokenHash_idx" ON "CustomerUser"("emailVerifyTokenHash");
