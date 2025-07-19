/*
  Warnings:

  - You are about to drop the column `hash_otp_code` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `otp_expires_at` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "hash_otp_code",
DROP COLUMN "otp_expires_at",
ADD COLUMN     "email_verification_token" TEXT,
ADD COLUMN     "email_verification_token_expires_at" TIMESTAMP(3);
