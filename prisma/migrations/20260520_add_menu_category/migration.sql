-- CreateEnum
CREATE TYPE "MenuCategory" AS ENUM ('cafe', 'pastries');

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "category" "MenuCategory" NOT NULL DEFAULT 'pastries';

-- CreateIndex
CREATE INDEX "MenuItem_category_idx" ON "MenuItem"("category");
