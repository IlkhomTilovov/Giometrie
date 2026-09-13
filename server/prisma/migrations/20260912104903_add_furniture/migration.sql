-- CreateTable
CREATE TABLE "furniture_categories" (
    "id" TEXT NOT NULL,
    "name_uz" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "furniture_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "furniture" (
    "id" TEXT NOT NULL,
    "name_uz" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "translations" JSONB NOT NULL DEFAULT '{}',
    "slug" TEXT NOT NULL,
    "category_id" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "article" TEXT,
    "image" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "furniture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_furniture" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "furniture_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_furniture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "furniture_categories_slug_key" ON "furniture_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "furniture_slug_key" ON "furniture"("slug");

-- CreateIndex
CREATE INDEX "furniture_category_id_idx" ON "furniture"("category_id");

-- CreateIndex
CREATE INDEX "furniture_is_active_sort_order_idx" ON "furniture"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "product_furniture_product_id_idx" ON "product_furniture"("product_id");

-- CreateIndex
CREATE INDEX "product_furniture_furniture_id_idx" ON "product_furniture"("furniture_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_furniture_product_id_furniture_id_key" ON "product_furniture"("product_id", "furniture_id");

-- AddForeignKey
ALTER TABLE "furniture" ADD CONSTRAINT "furniture_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "furniture_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_furniture" ADD CONSTRAINT "product_furniture_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_furniture" ADD CONSTRAINT "product_furniture_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "furniture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
