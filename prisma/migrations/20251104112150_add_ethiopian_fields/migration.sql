-- AlterTable
ALTER TABLE "Bid" ADD COLUMN "bidSecurityAmount" DECIMAL;
ALTER TABLE "Bid" ADD COLUMN "bidSecurityFilePath" TEXT;

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN "capacityScore" DECIMAL;
ALTER TABLE "Evaluation" ADD COLUMN "experienceScore" DECIMAL;
ALTER TABLE "Evaluation" ADD COLUMN "financialScore" DECIMAL;
ALTER TABLE "Evaluation" ADD COLUMN "methodologyScore" DECIMAL;
ALTER TABLE "Evaluation" ADD COLUMN "priceScore" DECIMAL;
ALTER TABLE "Evaluation" ADD COLUMN "technicalScore" DECIMAL;

-- AlterTable
ALTER TABLE "Tender" ADD COLUMN "bidSecurityRate" DECIMAL;
ALTER TABLE "Tender" ADD COLUMN "category" TEXT;
ALTER TABLE "Tender" ADD COLUMN "estimatedValue" DECIMAL;
ALTER TABLE "Tender" ADD COLUMN "openingDate" DATETIME;
ALTER TABLE "Tender" ADD COLUMN "openingLocation" TEXT;
ALTER TABLE "Tender" ADD COLUMN "region" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "businessLicenseNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "licenseFilePath" TEXT;
ALTER TABLE "User" ADD COLUMN "tinNumber" TEXT;
