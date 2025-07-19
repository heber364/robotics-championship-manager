/*
  Warnings:

  - You are about to drop the column `description` on the `arenas` table. All the data in the column will be lost.
  - You are about to drop the column `score_rules` on the `arenas` table. All the data in the column will be lost.
  - Added the required column `youtube_link` to the `arenas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "arenas" DROP COLUMN "description",
DROP COLUMN "score_rules",
ADD COLUMN     "youtube_link" TEXT NOT NULL;
