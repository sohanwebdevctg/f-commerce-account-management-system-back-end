/*
  Warnings:

  - The values [CANCELLED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `unitPrice` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryCharge` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `dueAmount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `paidAmount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `subTotal` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `productName` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellPrice` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'PROCESSING', 'CONFIRMED', 'DELIVERED', 'RETURNED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_createdById_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_orderId_fkey";

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "unitPrice",
ADD COLUMN     "colorCode" VARCHAR(50),
ADD COLUMN     "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "productName" VARCHAR(255) NOT NULL,
ADD COLUMN     "sellPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "size" VARCHAR(50),
ADD COLUMN     "variantName" VARCHAR(100);

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "deliveryCharge",
DROP COLUMN "discount",
DROP COLUMN "dueAmount",
DROP COLUMN "note",
DROP COLUMN "paidAmount",
DROP COLUMN "paymentStatus",
DROP COLUMN "subTotal",
DROP COLUMN "totalAmount",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "city" VARCHAR(120) NOT NULL,
ADD COLUMN     "email" VARCHAR(100),
ADD COLUMN     "isRemoved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" VARCHAR(100) NOT NULL,
ADD COLUMN     "phone" VARCHAR(20) NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "transactions";

-- DropEnum
DROP TYPE "PaymentStatus";
