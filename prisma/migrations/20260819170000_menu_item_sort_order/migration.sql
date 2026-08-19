-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill stable order per popup from createdAt
WITH ordered AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (PARTITION BY "popupId" ORDER BY "createdAt" ASC) - 1)::INTEGER AS rn
  FROM "MenuItem"
)
UPDATE "MenuItem" AS m
SET "sortOrder" = ordered.rn
FROM ordered
WHERE m.id = ordered.id;

-- CreateIndex
CREATE INDEX "MenuItem_popupId_sortOrder_idx" ON "MenuItem"("popupId", "sortOrder");
