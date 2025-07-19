/*
  Warnings:

  - Made the column `team_a_score` on table `matches` required. This step will fail if there are existing NULL values in that column.
  - Made the column `team_b_score` on table `matches` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_judge` on table `matches` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_id_judge_fkey";

-- AlterTable
ALTER TABLE "matches" ALTER COLUMN "team_a_score" SET NOT NULL,
ALTER COLUMN "team_a_score" SET DEFAULT 0,
ALTER COLUMN "team_b_score" SET NOT NULL,
ALTER COLUMN "team_b_score" SET DEFAULT 0,
ALTER COLUMN "id_judge" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_id_judge_fkey" FOREIGN KEY ("id_judge") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
