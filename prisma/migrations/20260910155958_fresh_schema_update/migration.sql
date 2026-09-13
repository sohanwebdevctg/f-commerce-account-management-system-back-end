/*
  Warnings:

  - You are about to drop the column `colorName` on the `product_colors` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `product_colors` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,colorCode]` on the table `product_colors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,size,colorId]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productId` to the `product_colors` table without a default value. This is not possible if the table is not empty.
  - Made the column `colorCode` on table `product_colors` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `productImage` to the `product_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnailImage` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "product_colors" DROP CONSTRAINT "product_colors_variantId_fkey";

-- DropIndex
DROP INDEX "product_colors_variantId_colorCode_key";

-- DropIndex
DROP INDEX "product_colors_variantId_colorName_key";

-- DropIndex
DROP INDEX "product_variants_productId_size_key";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "product_colors" DROP COLUMN "colorName",
DROP COLUMN "variantId",
ADD COLUMN     "productId" TEXT NOT NULL,
ALTER COLUMN "colorCode" SET NOT NULL;

-- AlterTable
ALTER TABLE "product_images" DROP COLUMN "url",
ADD COLUMN     "colorId" TEXT,
ADD COLUMN     "productImage" TEXT NOT NULL,
ALTER COLUMN "variantId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "colorId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "discountPercent" DECIMAL(5,2) DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maximumPrice" DECIMAL(10,2),
ADD COLUMN     "minimumPrice" DECIMAL(10,2),
ADD COLUMN     "profit" DECIMAL(10,2),
ADD COLUMN     "varientName" VARCHAR(100),
ADD COLUMN     "vatPercent" DECIMAL(5,2) DEFAULT 0;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "title",
ADD COLUMN     "brand" VARCHAR(50),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shortDescription" VARCHAR(255),
ADD COLUMN     "thumbnailImage" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "product_colors_productId_colorCode_key" ON "product_colors"("productId", "colorCode");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_productId_size_colorId_key" ON "product_variants"("productId", "size", "colorId");

-- AddForeignKey
ALTER TABLE "product_colors" ADD CONSTRAINT "product_colors_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "product_colors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "product_colors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
