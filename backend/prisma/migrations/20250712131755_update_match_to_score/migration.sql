/*
  Warnings:

  - You are about to drop the column `match_result` on the `matches` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "matches" DROP COLUMN "match_result",
ADD COLUMN     "team_a_score" INTEGER,
ADD COLUMN     "team_b_score" INTEGER;

-- DropEnum
DROP TYPE "MatchResult";
