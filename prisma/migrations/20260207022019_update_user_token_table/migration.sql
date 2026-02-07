/*
  Warnings:

  - A unique constraint covering the columns `[token_hash]` on the table `UserToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserToken_token_hash_key" ON "UserToken"("token_hash");
