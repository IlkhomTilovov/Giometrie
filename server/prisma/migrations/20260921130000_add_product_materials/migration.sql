-- CreateTable
CREATE TABLE "product_materials" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_materials_product_id_idx" ON "product_materials"("product_id");

-- CreateIndex
CREATE INDEX "product_materials_material_id_idx" ON "product_materials"("material_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_materials_product_id_material_id_key" ON "product_materials"("product_id", "material_id");

-- AddForeignKey
ALTER TABLE "product_materials" ADD CONSTRAINT "product_materials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_materials" ADD CONSTRAINT "product_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
