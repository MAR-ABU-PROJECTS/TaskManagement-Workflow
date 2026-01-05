-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promoted_at" TIMESTAMP(3),
ADD COLUMN     "promoted_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_promoted_by_id_fkey" FOREIGN KEY ("promoted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
