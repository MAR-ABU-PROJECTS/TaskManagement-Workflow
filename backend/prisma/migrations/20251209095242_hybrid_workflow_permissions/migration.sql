/*
  Warnings:

  - You are about to drop the column `permission_scheme_id` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the `permission_grants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permission_schemes` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "WorkflowType" AS ENUM ('BASIC', 'AGILE', 'BUG_TRACKING', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "permission_grants" DROP CONSTRAINT "permission_grants_scheme_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_permission_scheme_id_fkey";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "permission_scheme_id",
ADD COLUMN     "workflow_type" "WorkflowType" NOT NULL DEFAULT 'BASIC';

-- DropTable
DROP TABLE "permission_grants";

-- DropTable
DROP TABLE "permission_schemes";
