-- CreateTable
CREATE TABLE "Popup" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Popup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Popup_slug_key" ON "Popup"("slug");
CREATE INDEX "Popup_isActive_idx" ON "Popup"("isActive");
CREATE UNIQUE INDEX "Popup_one_active" ON "Popup"("isActive") WHERE "isActive" = true;

INSERT INTO "Popup" ("id", "slug", "name", "isActive", "createdAt")
VALUES
  ('passion', 'passion', 'Passion', true, CURRENT_TIMESTAMP),
  ('stonefruit', 'stonefruit', 'Stonefruit', false, CURRENT_TIMESTAMP);

ALTER TABLE "MenuItem" ADD COLUMN "popupId" TEXT;
ALTER TABLE "Order" ADD COLUMN "popupId" TEXT;

UPDATE "MenuItem" SET "popupId" = 'passion';
UPDATE "Order" SET "popupId" = 'passion';

ALTER TABLE "MenuItem" ALTER COLUMN "popupId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "popupId" SET NOT NULL;

ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_popupId_fkey" FOREIGN KEY ("popupId") REFERENCES "Popup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_popupId_fkey" FOREIGN KEY ("popupId") REFERENCES "Popup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "MenuItem_popupId_idx" ON "MenuItem"("popupId");
CREATE INDEX "Order_popupId_idx" ON "Order"("popupId");
