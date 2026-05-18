-- Add product cost field for admin cost management.
ALTER TABLE "Product" ADD COLUMN "costCents" INTEGER NOT NULL DEFAULT 0;
