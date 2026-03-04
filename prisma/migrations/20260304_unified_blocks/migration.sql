-- CreateTable: Unified Block model
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Block_pageId_order_idx" ON "Block"("pageId", "order");

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate data from ContentBlock to Block
INSERT INTO "Block" ("id", "pageId", "category", "type", "data", "order")
SELECT "id", "pageId", 'content', "type", "content", "order"
FROM "ContentBlock";

-- Migrate data from InteractionBlock to Block
-- Calculate order offset based on max content block order per page
INSERT INTO "Block" ("id", "pageId", "category", "type", "data", "order")
SELECT 
    ib."id", 
    ib."pageId", 
    'interaction', 
    ib."type", 
    ib."config", 
    ib."order" + COALESCE((SELECT MAX(cb."order") + 1 FROM "ContentBlock" cb WHERE cb."pageId" = ib."pageId"), 0)
FROM "InteractionBlock" ib;

-- Drop old tables
DROP TABLE "ContentBlock";
DROP TABLE "InteractionBlock";
