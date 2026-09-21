-- AlterTable
ALTER TABLE "products" ADD COLUMN     "certificates" TEXT[] DEFAULT ARRAY[]::TEXT[];
