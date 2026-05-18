-- AlterTable
ALTER TABLE "CustomerUser" ADD COLUMN "addressHash" TEXT;
ALTER TABLE "CustomerUser" ADD COLUMN "phoneHash" TEXT;
ALTER TABLE "CustomerUser" ADD COLUMN "postalCodeHash" TEXT;

-- CreateTable
CREATE TABLE "PaymentSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "publicToken" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
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
    "checkoutUrl" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentSessionItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paymentSessionId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "lineTotalCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentSessionItem_paymentSessionId_fkey" FOREIGN KEY ("paymentSessionId") REFERENCES "PaymentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentSessionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
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
INSERT INTO "new_Order" ("createdAt", "customerId", "id", "orderNumber", "shippingAddress1", "shippingAddress2", "shippingCity", "shippingCountry", "shippingEmail", "shippingName", "shippingPhone", "shippingPostalCode", "shippingProvince", "status", "subtotalCents", "totalCents", "updatedAt") SELECT "createdAt", "customerId", "id", "orderNumber", "shippingAddress1", "shippingAddress2", "shippingCity", "shippingCountry", "shippingEmail", "shippingName", "shippingPhone", "shippingPostalCode", "shippingProvince", "status", "subtotalCents", "totalCents", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_paymentSessionId_key" ON "Order"("paymentSessionId");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE TABLE "new_ProductVariant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reservedStock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductVariant" ("color", "createdAt", "id", "productId", "size", "sku", "stock", "updatedAt") SELECT "color", "createdAt", "id", "productId", "size", "sku", "stock", "updatedAt" FROM "ProductVariant";
DROP TABLE "ProductVariant";
ALTER TABLE "new_ProductVariant" RENAME TO "ProductVariant";
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");
CREATE UNIQUE INDEX "ProductVariant_productId_color_size_key" ON "ProductVariant"("productId", "color", "size");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSession_publicToken_key" ON "PaymentSession"("publicToken");

-- CreateIndex
CREATE INDEX "PaymentSession_customerId_idx" ON "PaymentSession"("customerId");

-- CreateIndex
CREATE INDEX "PaymentSession_status_expiresAt_idx" ON "PaymentSession"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "PaymentSessionItem_paymentSessionId_idx" ON "PaymentSessionItem"("paymentSessionId");

-- CreateIndex
CREATE INDEX "PaymentSessionItem_productId_idx" ON "PaymentSessionItem"("productId");

-- CreateIndex
CREATE INDEX "CustomerUser_phoneHash_idx" ON "CustomerUser"("phoneHash");

-- CreateIndex
CREATE INDEX "CustomerUser_postalCodeHash_idx" ON "CustomerUser"("postalCodeHash");

-- CreateIndex
CREATE INDEX "CustomerUser_addressHash_idx" ON "CustomerUser"("addressHash");
