-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hashOtpCode" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3);
