-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "id_judge" INTEGER;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_id_judge_fkey" FOREIGN KEY ("id_judge") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
