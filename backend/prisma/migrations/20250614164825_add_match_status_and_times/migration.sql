/*
  Warnings:

  - The `status` column on the `matches` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "end_time" TIMESTAMP(3),
ADD COLUMN     "start_time" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED';
