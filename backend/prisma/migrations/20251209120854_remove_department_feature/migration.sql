/*
  Warnings:

  - You are about to drop the column `department` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projects" DROP COLUMN "department";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "department";

-- DropEnum
DROP TYPE "Department";
