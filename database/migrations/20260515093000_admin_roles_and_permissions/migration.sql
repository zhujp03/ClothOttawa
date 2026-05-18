ALTER TABLE "AdminUser" ADD COLUMN "username" TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE "AdminUser" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'ADMIN';
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");
