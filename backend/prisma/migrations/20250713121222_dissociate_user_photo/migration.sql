/*
  Warnings:

  - You are about to drop the column `id_user` on the `photos` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "photos" DROP CONSTRAINT "photos_id_user_fkey";

-- AlterTable
ALTER TABLE "photos" DROP COLUMN "id_user";
