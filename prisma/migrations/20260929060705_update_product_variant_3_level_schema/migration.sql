/*
  Warnings:

  - You are about to drop the column `colorId` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `colorId` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `costPrice` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `discountPercent` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `maximumPrice` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `minimumPrice` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `profit` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `sellPrice` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `varientName` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `vatPercent` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the `product_colors` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[productId,colorCode]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "product_colors" DROP CONSTRAINT "product_colors_productId_fkey";

-- DropForeignKey
ALTER TABLE "product_images" DROP CONSTRAINT "product_images_colorId_fkey";

-- DropForeignKey
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_colorId_fkey";

-- DropIndex
DROP INDEX "product_variants_productId_size_colorId_key";

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "variantItemId" TEXT;

-- AlterTable
ALTER TABLE "product_images" DROP COLUMN "colorId";

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "colorId",
DROP COLUMN "costPrice",
DROP COLUMN "discountPercent",
DROP COLUMN "maximumPrice",
DROP COLUMN "minimumPrice",
DROP COLUMN "profit",
DROP COLUMN "sellPrice",
DROP COLUMN "size",
DROP COLUMN "stock",
DROP COLUMN "varientName",
DROP COLUMN "vatPercent",
ADD COLUMN     "colorCode" VARCHAR(50);

-- DropTable
DROP TABLE "product_colors";

-- CreateTable
CREATE TABLE "variant_items" (
    "id" TEXT NOT NULL,
    "size" VARCHAR(50),
    "costPrice" DECIMAL(10,2) NOT NULL,
    "minimumPrice" DECIMAL(10,2),
    "maximumPrice" DECIMAL(10,2),
    "sellPrice" DECIMAL(10,2) NOT NULL,
    "profit" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "vatPercent" DECIMAL(5,2) DEFAULT 0,
    "discountPercent" DECIMAL(5,2) DEFAULT 0,
    "varientName" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "variantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "variant_items_variantId_size_key" ON "variant_items"("variantId", "size");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_productId_colorCode_key" ON "product_variants"("productId", "colorCode");

-- AddForeignKey
ALTER TABLE "variant_items" ADD CONSTRAINT "variant_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantItemId_fkey" FOREIGN KEY ("variantItemId") REFERENCES "variant_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
