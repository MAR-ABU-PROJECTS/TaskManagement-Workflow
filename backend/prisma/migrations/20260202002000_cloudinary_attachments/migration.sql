-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('LOCAL', 'CLOUDINARY');

-- AlterTable
ALTER TABLE "task_attachments" ALTER COLUMN "file_path" DROP NOT NULL;
ALTER TABLE "task_attachments" ADD COLUMN "storage_provider" "StorageProvider" NOT NULL DEFAULT 'LOCAL';
ALTER TABLE "task_attachments" ADD COLUMN "cloudinary_public_id" TEXT;
ALTER TABLE "task_attachments" ADD COLUMN "cloudinary_asset_id" TEXT;
ALTER TABLE "task_attachments" ADD COLUMN "cloudinary_url" TEXT;
ALTER TABLE "task_attachments" ADD COLUMN "cloudinary_resource_type" TEXT;

-- CreateIndex
CREATE INDEX "task_attachments_cloudinary_public_id_idx" ON "task_attachments"("cloudinary_public_id");
