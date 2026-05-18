-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PaymentSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "publicToken" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'SQUARE',
    "etransferVerificationCents" INTEGER NOT NULL DEFAULT 0,
    "subtotalCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "shippingName" TEXT NOT NULL,
    "shippingPhone" TEXT NOT NULL,
    "shippingEmail" TEXT NOT NULL,
    "shippingAddress1" TEXT NOT NULL,
    "shippingAddress2" TEXT,
    "shippingCity" TEXT NOT NULL,
    "shippingProvince" TEXT NOT NULL,
    "shippingPostalCode" TEXT NOT NULL,
    "shippingCountry" TEXT NOT NULL,
    "squarePaymentLinkId" TEXT,
    "squareOrderId" TEXT,
    "squarePaymentId" TEXT,
    "etransferMatchedAt" DATETIME,
    "etransferMatchRef" TEXT,
    "confirmationEmailSentAt" DATETIME,
    "checkoutUrl" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PaymentSession" ("checkoutUrl", "confirmationEmailSentAt", "createdAt", "currency", "customerId", "etransferMatchRef", "etransferMatchedAt", "expiresAt", "id", "paidAt", "paymentMethod", "publicToken", "shippingAddress1", "shippingAddress2", "shippingCity", "shippingCountry", "shippingEmail", "shippingName", "shippingPhone", "shippingPostalCode", "shippingProvince", "squareOrderId", "squarePaymentId", "squarePaymentLinkId", "status", "subtotalCents", "totalCents", "updatedAt") SELECT "checkoutUrl", "confirmationEmailSentAt", "createdAt", "currency", "customerId", "etransferMatchRef", "etransferMatchedAt", "expiresAt", "id", "paidAt", "paymentMethod", "publicToken", "shippingAddress1", "shippingAddress2", "shippingCity", "shippingCountry", "shippingEmail", "shippingName", "shippingPhone", "shippingPostalCode", "shippingProvince", "squareOrderId", "squarePaymentId", "squarePaymentLinkId", "status", "subtotalCents", "totalCents", "updatedAt" FROM "PaymentSession";
DROP TABLE "PaymentSession";
ALTER TABLE "new_PaymentSession" RENAME TO "PaymentSession";
CREATE UNIQUE INDEX "PaymentSession_publicToken_key" ON "PaymentSession"("publicToken");
CREATE INDEX "PaymentSession_customerId_idx" ON "PaymentSession"("customerId");
CREATE INDEX "PaymentSession_status_expiresAt_idx" ON "PaymentSession"("status", "expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
