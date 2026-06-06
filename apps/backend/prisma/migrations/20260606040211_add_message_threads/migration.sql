-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "parentMessageId" TEXT;

-- CreateIndex
CREATE INDEX "Message_parentMessageId_idx" ON "Message"("parentMessageId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
