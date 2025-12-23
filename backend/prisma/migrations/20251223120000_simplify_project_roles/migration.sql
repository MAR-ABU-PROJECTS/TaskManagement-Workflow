-- AlterEnum
-- Step 1: Update existing PROJECT_LEAD members to PROJECT_ADMIN
UPDATE "project_members"
SET "role" = 'PROJECT_ADMIN'
WHERE "role" = 'PROJECT_LEAD';

-- Step 2: Update existing REPORTER and VIEWER members to DEVELOPER
UPDATE "project_members"
SET "role" = 'DEVELOPER'
WHERE "role" IN ('REPORTER', 'VIEWER');

-- Step 3: Update workflow_transitions that reference removed roles
UPDATE "workflow_transitions"
SET "required_role" = 'PROJECT_ADMIN'
WHERE "required_role" = 'PROJECT_LEAD';

UPDATE "workflow_transitions"
SET "required_role" = 'DEVELOPER'
WHERE "required_role" IN ('REPORTER', 'VIEWER');

-- Step 4: Recreate the enum type with only PROJECT_ADMIN and DEVELOPER
CREATE TYPE "ProjectRole_new" AS ENUM ('PROJECT_ADMIN', 'DEVELOPER');

-- Step 5: Alter table columns to use the new enum
ALTER TABLE "project_members" 
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "ProjectRole_new" USING ("role"::text::"ProjectRole_new"),
  ALTER COLUMN "role" SET DEFAULT 'DEVELOPER'::"ProjectRole_new";

ALTER TABLE "workflow_transitions"
  ALTER COLUMN "required_role" TYPE "ProjectRole_new"
  USING ("required_role"::text::"ProjectRole_new");

-- Step 6: Drop the old enum and rename the new one
DROP TYPE "ProjectRole";
ALTER TYPE "ProjectRole_new" RENAME TO "ProjectRole";
