/*
  Warnings:

  - You are about to drop the column `description` on the `furniture` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "furniture" DROP COLUMN "description",
ADD COLUMN     "application_category_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "description_ru" TEXT,
ADD COLUMN     "description_uz" TEXT,
ADD COLUMN     "full_description_ru" TEXT,
ADD COLUMN     "full_description_uz" TEXT,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "installation_notes_ru" TEXT,
ADD COLUMN     "installation_notes_uz" TEXT,
ADD COLUMN     "installation_type_ru" TEXT,
ADD COLUMN     "installation_type_uz" TEXT,
ADD COLUMN     "meta_description_ru" TEXT,
ADD COLUMN     "meta_description_uz" TEXT,
ADD COLUMN     "meta_keywords" TEXT,
ADD COLUMN     "meta_title_ru" TEXT,
ADD COLUMN     "meta_title_uz" TEXT,
ADD COLUMN     "specifications" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "usage_instructions_ru" TEXT,
ADD COLUMN     "usage_instructions_uz" TEXT;
