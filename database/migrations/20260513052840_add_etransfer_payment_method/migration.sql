-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
    "paymentMethod" TEXT NOT NULL DEFAULT 'SQUARE',
    "paymentReference" TEXT,
    "subtotalCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "paymentSessionId" INTEGER,
    "shippingName" TEXT NOT NULL,
    "shippingPhone" TEXT NOT NULL,
    "shippingEmail" TEXT NOT NULL,
    "shippingAddress1" TEXT NOT NULL,
    "shippingAddress2" TEXT,
    "shippingCity" TEXT NOT NULL,
    "shippingProvince" TEXT NOT NULL,
    "shippingPostalCode" TEXT NOT NULL,
    "shippingCountry" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_paymentSessionId_fkey" FOREIGN KEY ("paymentSessionId") REFERENCES "PaymentSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerId", "id", "orderNumber", "paymentSessionId", "shippingAddress1", "shippingAddress2", "shippingCity", "shippingCountry", "shippingEmail", "shippingName", "shippingPhone", "shippingPostalCode", "shippingProvince", "status", "subtotalCents", "totalCents", "trackingNumber", "updatedAt") SELECT "createdAt", "customerId", "id", "orderNumber", "paymentSessionId", "shippingAddress1", "shippingAddress2", "shippingCity", "shippingCountry", "shippingEmail", "shippingName", "shippingPhone", "shippingPostalCode", "shippingProvince", "status", "subtotalCents", "totalCents", "trackingNumber", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_paymentSessionId_key" ON "Order"("paymentSessionId");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE TABLE "new_OrderHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DELIVERED',
    "paymentMethod" TEXT NOT NULL DEFAULT 'SQUARE',
    "paymentReference" TEXT,
    "subtotalCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "paymentSessionId" INTEGER,
    "shippingName" TEXT NOT NULL,
    "shippingPhone" TEXT NOT NULL,
    "shippingEmail" TEXT NOT NULL,
    "shippingAddress1" TEXT NOT NULL,
    "shippingAddress2" TEXT,
    "shippingCity" TEXT NOT NULL,
    "shippingProvince" TEXT NOT NULL,
    "shippingPostalCode" TEXT NOT NULL,
    "shippingCountry" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrderHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderHistory" ("createdAt", "customerId", "id", "orderNumber", "paymentSessionId", "shippingAddress1", "shippingAddress2", "shippingCity", "shippingCountry", "shippingEmail", "shippingName", "shippingPhone", "shippingPostalCode", "shippingProvince", "status", "subtotalCents", "totalCents", "trackingNumber", "updatedAt") SELECT "createdAt", "customerId", "id", "orderNumber", "paymentSessionId", "shippingAddress1", "shippingAddress2", "shippingCity", "shippingCountry", "shippingEmail", "shippingName", "shippingPhone", "shippingPostalCode", "shippingProvince", "status", "subtotalCents", "totalCents", "trackingNumber", "updatedAt" FROM "OrderHistory";
DROP TABLE "OrderHistory";
ALTER TABLE "new_OrderHistory" RENAME TO "OrderHistory";
CREATE UNIQUE INDEX "OrderHistory_orderNumber_key" ON "OrderHistory"("orderNumber");
CREATE INDEX "OrderHistory_customerId_idx" ON "OrderHistory"("customerId");
CREATE INDEX "OrderHistory_createdAt_idx" ON "OrderHistory"("createdAt");
CREATE TABLE "new_PaymentSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "publicToken" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'SQUARE',
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
    "checkoutUrl" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PaymentSession" ("checkoutUrl", "createdAt", "currency", "customerId", "expiresAt", "id", "paidAt", "publicToken", "shippingAddress1", "shippingAddress2", "shippingCity", "shippingCountry", "shippingEmail", "shippingName", "shippingPhone", "shippingPostalCode", "shippingProvince", "squareOrderId", "squarePaymentId", "squarePaymentLinkId", "status", "subtotalCents", "totalCents", "updatedAt") SELECT "checkoutUrl", "createdAt", "currency", "customerId", "expiresAt", "id", "paidAt", "publicToken", "shippingAddress1", "shippingAddress2", "shippingCity", "shippingCountry", "shippingEmail", "shippingName", "shippingPhone", "shippingPostalCode", "shippingProvince", "squareOrderId", "squarePaymentId", "squarePaymentLinkId", "status", "subtotalCents", "totalCents", "updatedAt" FROM "PaymentSession";
DROP TABLE "PaymentSession";
ALTER TABLE "new_PaymentSession" RENAME TO "PaymentSession";
CREATE UNIQUE INDEX "PaymentSession_publicToken_key" ON "PaymentSession"("publicToken");
CREATE INDEX "PaymentSession_customerId_idx" ON "PaymentSession"("customerId");
CREATE INDEX "PaymentSession_status_expiresAt_idx" ON "PaymentSession"("status", "expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
