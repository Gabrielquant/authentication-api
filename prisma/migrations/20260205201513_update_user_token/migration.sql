/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `UserToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserToken_user_id_key" ON "UserToken"("user_id");
