/*
  Warnings:

  - A unique constraint covering the columns `[winningBidId]` on the table `Tender` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "BidStatus" ADD VALUE 'AWARDED';

-- AlterTable
ALTER TABLE "Tender" ADD COLUMN     "awardedAt" TIMESTAMP(3),
ADD COLUMN     "winningBidId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tender_winningBidId_key" ON "Tender"("winningBidId");

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_winningBidId_fkey" FOREIGN KEY ("winningBidId") REFERENCES "Bid"("id") ON DELETE SET NULL ON UPDATE CASCADE;
