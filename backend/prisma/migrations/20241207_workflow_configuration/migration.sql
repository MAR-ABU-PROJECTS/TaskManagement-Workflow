-- CreateEnum
CREATE TYPE "workflow_type" AS ENUM ('TASK', 'ISSUE', 'EPIC', 'STORY', 'BUG');

-- CreateEnum
CREATE TYPE "workflow_status" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT');

-- CreateEnum
CREATE TYPE "custom_field_type" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'DATETIME', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'USER', 'MULTI_USER', 'URL', 'EMAIL', 'TEXTAREA', 'RICH_TEXT', 'FILE');

-- AlterTable
ALTER TABLE "workflows" ADD COLUMN     "description" TEXT,
ADD COLUMN     "type" "workflow_type" NOT NULL DEFAULT 'TASK',
ADD COLUMN     "status" "workflow_status" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "created_by" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "states" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "transitions" JSONB NOT NULL DEFAULT '[]',
ALTER COLUMN "project_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "current_state_id" TEXT,
ADD COLUMN     "workflow_id" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'TODO',
DROP COLUMN "status_id";

-- AlterTable
ALTER TABLE "issues" ADD COLUMN     "current_state_id" TEXT,
ADD COLUMN     "workflow_id" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN',
DROP COLUMN "status_id";

-- AlterTable
ALTER TABLE "custom_fields" ADD COLUMN     "configuration_id" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "default_value" JSONB,
ADD COLUMN     "validation" JSONB,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "applies_to" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "created_by" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "project_id" DROP NOT NULL,
ALTER COLUMN "type" TYPE "custom_field_type" USING ("type"::text::"custom_field_type"),
ALTER COLUMN "options" TYPE JSONB[] USING ARRAY[to_jsonb("options")],
ALTER COLUMN "is_required" RENAME TO "required";

-- CreateTable
CREATE TABLE "workflow_transition_logs" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "transition_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "from_state_id" TEXT NOT NULL,
    "to_state_id" TEXT NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "workflow_transition_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_configurations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "workflows" TEXT[],
    "templates" JSONB[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "configuration" JSONB NOT NULL,
    "workflows" TEXT[],
    "custom_fields" TEXT[],
    "default_roles" JSONB[],
    "sample_tasks" JSONB[],
    "created_by" TEXT NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_custom_field_values" (
    "id" TEXT NOT NULL,
    "custom_field_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "task_custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_custom_field_values" (
    "id" TEXT NOT NULL,
    "custom_field_id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "issue_custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_configurations_project_id_key" ON "project_configurations"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_custom_field_values_custom_field_id_task_id_key" ON "task_custom_field_values"("custom_field_id", "task_id");

-- CreateIndex
CREATE UNIQUE INDEX "issue_custom_field_values_custom_field_id_issue_id_key" ON "issue_custom_field_values"("custom_field_id", "issue_id");

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transition_logs" ADD CONSTRAINT "workflow_transition_logs_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_configurations" ADD CONSTRAINT "project_configurations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_configuration_id_fkey" FOREIGN KEY ("configuration_id") REFERENCES "project_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_custom_field_values" ADD CONSTRAINT "task_custom_field_values_custom_field_id_fkey" FOREIGN KEY ("custom_field_id") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_custom_field_values" ADD CONSTRAINT "task_custom_field_values_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_custom_field_values" ADD CONSTRAINT "issue_custom_field_values_custom_field_id_fkey" FOREIGN KEY ("custom_field_id") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_custom_field_values" ADD CONSTRAINT "issue_custom_field_values_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old tables that are no longer needed
DROP TABLE IF EXISTS "workflow_statuses";
DROP TABLE IF EXISTS "workflow_transitions";
DROP TABLE IF EXISTS "custom_field_values";