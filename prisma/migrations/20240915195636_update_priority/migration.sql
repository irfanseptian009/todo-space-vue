/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Todo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Todo" DROP COLUMN "createdAt",
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'Medium';
