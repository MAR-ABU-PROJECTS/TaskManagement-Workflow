-- Migration: Add multiple assignees support
-- Created: 2025-12-21
-- Description: Convert single assignee to many-to-many relationship

-- Step 1: Create TaskAssignee junction table
CREATE TABLE "task_assignees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,

    CONSTRAINT "task_assignees_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 2: Create unique constraint to prevent duplicate assignments
CREATE UNIQUE INDEX "task_assignees_task_id_user_id_key" ON "task_assignees"("task_id", "user_id");

-- Step 3: Migrate existing assignee data to new table
INSERT INTO "task_assignees" ("id", "task_id", "user_id", "assigned_at")
SELECT 
    gen_random_uuid(),
    "id" as "task_id",
    "assignee_id" as "user_id",
    "created_at" as "assigned_at"
FROM "tasks"
WHERE "assignee_id" IS NOT NULL;

-- Step 4: Drop old assignee_id column
ALTER TABLE "tasks" DROP COLUMN "assignee_id";
