-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "MenuItem_archived_idx" ON "MenuItem"("archived");
