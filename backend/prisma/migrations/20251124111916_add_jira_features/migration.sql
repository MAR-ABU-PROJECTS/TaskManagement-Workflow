/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `projects` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DependencyType" AS ENUM ('BLOCKS', 'IS_BLOCKED_BY', 'RELATES_TO');

-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('PROJECT_ADMIN', 'PROJECT_LEAD', 'DEVELOPER', 'REPORTER', 'VIEWER');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('ADMINISTER_PROJECT', 'BROWSE_PROJECT', 'EDIT_PROJECT', 'CREATE_ISSUES', 'EDIT_ISSUES', 'EDIT_OWN_ISSUES', 'DELETE_ISSUES', 'DELETE_OWN_ISSUES', 'ASSIGN_ISSUES', 'ASSIGNABLE_USER', 'CLOSE_ISSUES', 'TRANSITION_ISSUES', 'MOVE_ISSUES', 'ADD_COMMENTS', 'EDIT_ALL_COMMENTS', 'EDIT_OWN_COMMENTS', 'DELETE_ALL_COMMENTS', 'DELETE_OWN_COMMENTS', 'CREATE_ATTACHMENTS', 'DELETE_ALL_ATTACHMENTS', 'DELETE_OWN_ATTACHMENTS', 'WORK_ON_ISSUES', 'EDIT_OWN_WORKLOGS', 'EDIT_ALL_WORKLOGS', 'DELETE_OWN_WORKLOGS', 'DELETE_ALL_WORKLOGS', 'MANAGE_SPRINTS', 'VIEW_SPRINTS', 'MANAGE_EPICS', 'VIEW_EPICS');

-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('SCRUM', 'KANBAN');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CUSTOM');

-- AlterTable
ALTER TABLE "_TaskWatchers" ADD CONSTRAINT "_TaskWatchers_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_TaskWatchers_AB_unique";

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "permission_scheme_id" TEXT,
ADD COLUMN     "workflow_scheme_id" TEXT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "board_column_id" TEXT,
ADD COLUMN     "component_id" TEXT,
ADD COLUMN     "epic_id" TEXT,
ADD COLUMN     "estimated_hours" DOUBLE PRECISION,
ADD COLUMN     "logged_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reporter_id" TEXT,
ADD COLUMN     "sprint_id" TEXT,
ADD COLUMN     "story_points" INTEGER,
ADD COLUMN     "version_id" TEXT;

-- CreateTable
CREATE TABLE "task_dependencies" (
    "id" TEXT NOT NULL,
    "dependent_task_id" TEXT NOT NULL,
    "blocking_task_id" TEXT NOT NULL,
    "type" "DependencyType" NOT NULL DEFAULT 'BLOCKS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_timers" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "description" TEXT,

    CONSTRAINT "active_timers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_attachments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epics" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNING',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "capacity_hours" DOUBLE PRECISION,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'DEVELOPER',
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by_id" TEXT NOT NULL,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_schemes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_grants" (
    "id" TEXT NOT NULL,
    "scheme_id" TEXT NOT NULL,
    "permission" "Permission" NOT NULL,
    "granted_to_role" "ProjectRole",
    "granted_to_user_role" "UserRole",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_schemes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_transitions" (
    "id" TEXT NOT NULL,
    "scheme_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "from_status" "TaskStatus" NOT NULL,
    "to_status" "TaskStatus" NOT NULL,
    "issue_type" "IssueType",
    "required_role" "ProjectRole",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boards" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BoardType" NOT NULL DEFAULT 'KANBAN',
    "description" TEXT,
    "filter_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_columns" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'TODO',
    "mapped_statuses" "TaskStatus"[],
    "position" INTEGER NOT NULL DEFAULT 0,
    "wip_limit" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_components" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lead_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_versions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "release_date" TIMESTAMP(3),
    "is_released" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "jql" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_dependent_task_id_blocking_task_id_key" ON "task_dependencies"("dependent_task_id", "blocking_task_id");

-- CreateIndex
CREATE UNIQUE INDEX "active_timers_user_id_key" ON "active_timers"("user_id");

-- CreateIndex
CREATE INDEX "project_members_project_id_idx" ON "project_members"("project_id");

-- CreateIndex
CREATE INDEX "project_members_user_id_idx" ON "project_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_schemes_name_key" ON "permission_schemes"("name");

-- CreateIndex
CREATE INDEX "permission_grants_scheme_id_idx" ON "permission_grants"("scheme_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_schemes_name_key" ON "workflow_schemes"("name");

-- CreateIndex
CREATE INDEX "workflow_transitions_scheme_id_idx" ON "workflow_transitions"("scheme_id");

-- CreateIndex
CREATE INDEX "boards_project_id_idx" ON "boards"("project_id");

-- CreateIndex
CREATE INDEX "board_columns_board_id_idx" ON "board_columns"("board_id");

-- CreateIndex
CREATE INDEX "project_components_project_id_idx" ON "project_components"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_components_project_id_name_key" ON "project_components"("project_id", "name");

-- CreateIndex
CREATE INDEX "project_versions_project_id_idx" ON "project_versions"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_versions_project_id_name_key" ON "project_versions"("project_id", "name");

-- CreateIndex
CREATE INDEX "saved_filters_user_id_idx" ON "saved_filters"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_key_key" ON "projects"("key");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_permission_scheme_id_fkey" FOREIGN KEY ("permission_scheme_id") REFERENCES "permission_schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workflow_scheme_id_fkey" FOREIGN KEY ("workflow_scheme_id") REFERENCES "workflow_schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "project_components"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "project_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_epic_id_fkey" FOREIGN KEY ("epic_id") REFERENCES "epics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_board_column_id_fkey" FOREIGN KEY ("board_column_id") REFERENCES "board_columns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_dependent_task_id_fkey" FOREIGN KEY ("dependent_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_blocking_task_id_fkey" FOREIGN KEY ("blocking_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_timers" ADD CONSTRAINT "active_timers_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_timers" ADD CONSTRAINT "active_timers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epics" ADD CONSTRAINT "epics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_grants" ADD CONSTRAINT "permission_grants_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "permission_schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "workflow_schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_filter_id_fkey" FOREIGN KEY ("filter_id") REFERENCES "saved_filters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_columns" ADD CONSTRAINT "board_columns_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_components" ADD CONSTRAINT "project_components_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_versions" ADD CONSTRAINT "project_versions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
