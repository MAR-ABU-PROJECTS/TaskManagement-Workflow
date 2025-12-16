# Task Management System - Complete API Documentation

**Version:** 2.0.0  
**Last Updated:** December 16, 2025  
**Base URL:** `https://taskmanagement-workflow-production.up.railway.app`  
**Total Endpoints:** 75+ (includes new workflow endpoints)  
**Documentation Coverage:** 100%

> ⚡ **NEW:** Jira-style workflow system with validated transitions. See [Workflow Endpoints](#workflow-endpoints) section.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Authentication](#authentication)
4. [RBAC System](#rbac-system)
5. [Workflow System](#workflow-system)
6. [API Endpoints](#api-endpoints)
7. [Error Handling](#error-handling)

---

## Overview

This is a comprehensive **Jira-like Task Management System** with advanced features including:

- ✅ **Dual RBAC System**: Global user roles (CEO, HOO, HR, ADMIN, STAFF) + Project-level roles (PROJECT_ADMIN, PROJECT_LEAD, DEVELOPER, REPORTER, VIEWER)
- ✅ **Granular Permissions**: 32+ fine-grained permissions following Jira's permission model
- ✅ **Workflow State Machine**: Jira-style workflow with validated transitions (BASIC, AGILE, BUG_TRACKING, CUSTOM)
- ✅ **Agile Workflows**: Sprints, Epics, Backlogs, Status-based Kanban boards
- ✅ **Advanced Features**: JQL-like search, Saved Filters, Workflow-validated Bulk Operations, Time Tracking
- ✅ **Team Collaboration**: Comments, Mentions, Attachments, Activity Logs
- ✅ **Reporting**: Burndown/Burnup charts, Velocity reports, Team productivity metrics
- ✅ **Email Notifications**: Resend integration for promotion, demotion, task assignment, etc.
- ✅ **Automation System**: 17 built-in automation rules for workflow optimization

---

## Quick Start

### 1. Register & Login

```bash
# Register new user (defaults to STAFF role)
POST https://taskmanagement-workflow-production.up.railway.app/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Login
POST https://taskmanagement-workflow-production.up.railway.app/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": { "id": "...", "email": "...", "role": "STAFF" }
}
```

### 2. Make Authenticated Requests

```bash
GET https://taskmanagement-workflow-production.up.railway.app/api/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Authentication

All API endpoints (except `/api/auth/login` and `/api/auth/register`) require authentication via **Bearer Token**.

### Auth Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login and get JWT token | ❌ |
| GET | `/api/auth/me` | Get current user profile | ✅ |
| POST | `/api/auth/logout` | Logout (invalidate token) | ✅ |
| POST | `/api/auth/refresh` | Refresh access token | ✅ |

**Token Expiry:**
- Access Token: 24 hours
- Refresh Token: 7 days

**Example Authorization Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## RBAC System

### Global User Roles

| Role | Hierarchy Level | Description |
|------|----------------|-------------|
| **SUPER_ADMIN** | 100 | System Administrator - Outside organization, controls everything (2 permanent accounts) |
| **CEO** | 80 | Chief Executive Officer - Top of organization hierarchy |
| **HOO** | 60 | Head of Operations - Operations department oversight |
| **HR** | 60 | Human Resources - HR department management |
| **ADMIN** | 40 | Department Administrator - Mid-level management |
| **STAFF** | 20 | Regular Staff - Base level, default role |

### Role Hierarchy & Promotion System

The system implements a **Jira-style hierarchical role system** with strict promotion/demotion rules:

**Promotion Authority:**
- **Super Admin**: Can promote to any role (CEO, HOO, HR, ADMIN, STAFF)
- **CEO**: Can promote to HOO, HR, ADMIN, STAFF
- **HOO**: Can promote STAFF → ADMIN (OPS department only)
- **HR**: Can promote STAFF → ADMIN (HR department only)
- **ADMIN/STAFF**: Cannot promote anyone

**Auto-Department Assignment:**
- **HOO** → Always gets `OPS` department
- **HR** → Always gets `HR` department
- **ADMIN** (by HOO) → Gets `OPS` department
- **ADMIN** (by HR) → Gets `HR` department

**Protection Rules:**
- Super Admins cannot be removed, modified, promoted, demoted, or deactivated
- Super Admins don't appear in company logs (outside organization)
- Only 2 Super Admin accounts exist in the system
- User removal requires task reassignment if user has assigned tasks
- Email notifications sent for promotions and demotions

### Project Roles

| Role | Hierarchy Level | Description |
|------|----------------|-------------|
| **PROJECT_ADMIN** | 4 | Full project control, all permissions |
| **PROJECT_LEAD** | 3 | Manage sprints, epics, assign tasks |
| **DEVELOPER** | 2 | Create, edit own issues, work on tasks |
| **REPORTER** | 1 | Create issues, add comments |
| **VIEWER** | 0 | Read-only access to project |

The system uses **32 granular permissions** organized into categories:

#### Project Permissions

- `ADMINISTER_PROJECT` - Full project administration
- `EDIT_PROJECT` - Modify project settings

#### Issue Permissions

- `CREATE_ISSUES` - Create new issues/tasks
- `CREATE_ISSUES` - Create new issues/tasks
- `EDIT_ISSUES` - Edit any issue
- `EDIT_OWN_ISSUES` - Edit own issues only
- `DELETE_ISSUES` - Delete any issue
- `DELETE_OWN_ISSUES` - Delete own issues only
- `ASSIGN_ISSUES` - Assign issues to users
- `ASSIGNABLE_USER` - Can be assigned to issues
- `MOVE_ISSUES` - Move issues between projects

#### Comment Permissions

- `ADD_COMMENTS` - Add comments to issues
#### Comment Permissions
- `ADD_COMMENTS` - Add comments to issues
- `DELETE_OWN_COMMENTS` - Delete own comments only

#### Attachment Permissions

- `CREATE_ATTACHMENTS` - Upload attachments
- `DELETE_OWN_ATTACHMENTS` - Delete own attachments only

#### Time Tracking Permissions

- `WORK_ON_ISSUES` - Log time on issues
- `DELETE_OWN_ATTACHMENTS` - Delete own attachments only

- `DELETE_ALL_WORKLOGS` - Delete any time entry

#### Sprint & Epic Permissions

- `MANAGE_SPRINTS` - Create, edit, delete sprints
- `DELETE_OWN_WORKLOGS` - Delete own time entries
- `DELETE_ALL_WORKLOGS` - Delete any time entry

#### Sprint & Epic Permissions
- `MANAGE_SPRINTS` - Create, edit, delete sprints
- `VIEW_SPRINTS` - View sprint details
- `MANAGE_EPICS` - Create, edit, delete epics
- `VIEW_EPICS` - View epic details
- `TRANSITION_ISSUES` - Change task status (workflow-validated)

---

## Workflow System

> 🎯 **Jira-Style Architecture:** Tasks follow workflow state machines. Status is the source of truth; columns are calculated views.

### Workflow Types

Each project has a `workflowType` that determines valid status transitions:

| Type | Description | Transitions |
|------|-------------|-------------|
| **BASIC** | Simple linear workflow | DRAFT → ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED |
| **AGILE** | Scrum/Kanban with review | DRAFT → ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED (iterative) |
| **BUG_TRACKING** | Bug lifecycle | NEW → CONFIRMED → FIXING → TESTING → CLOSED |
| **CUSTOM** | Database-defined rules | Custom transitions per project |

### Status Categories

Statuses map to board columns for visualization:

| Category | Statuses | Description |
|----------|----------|-------------|
| **TODO** | DRAFT, ASSIGNED | Work not started |
| **IN_PROGRESS** | IN_PROGRESS, PAUSED | Work being done |
| **REVIEW** | REVIEW | Under review/testing |
| **DONE** | COMPLETED, REJECTED | Finished |

### Transition Validation

All status changes are validated:

1. **Get project's workflow type** (BASIC, AGILE, etc.)
2. **Check user's project role** (for role-based transitions)
3. **Validate transition** using `isTransitionAllowed()`
4. **Update or reject** with detailed error message

**Example Valid Transition (AGILE workflow):**
```
Current: IN_PROGRESS
Allowed: [REVIEW, PAUSED]
Blocked: [COMPLETED] - Must go through REVIEW first
```

### Workflow Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/workflow` | Get project workflow config |
| GET | `/api/tasks/:id/transitions` | Get available transitions for task |
| POST | `/api/tasks/:id/transition` | Change task status (validated) |
| POST | `/api/tasks/:id/move` | Move task on board (status + position) |
| GET | `/api/tasks/board/:projectId` | Get Kanban board with workflow info |

**Key Features:**
- ✅ Role-based transition filtering
- ✅ Workflow-specific validation rules
- ✅ Bulk operations with validation
- ✅ Detailed error messages for invalid transitions
- ✅ Activity logging for all transitions

**See:** [WORKFLOW_ARCHITECTURE.md](./WORKFLOW_ARCHITECTURE.md) for complete workflow documentation.

---

## API Endpoints by Category

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| POST | `/auth/register?interface=STAFF` | Register new user | Public | - |
| POST | `/auth/login?interface=STAFF` | Login | Public | - |
| GET | `/auth/me` | Get current user | Authenticated | All |
| POST | `/auth/logout` | Logout | Authenticated | All |

**Notes:**
- `interface` query parameter is required for register/login
- All new registrations default to STAFF role
- Super Admins cannot be created through registration

---

### 2. User Hierarchy Management (`/api/users`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| GET | `/users/hierarchy` | Get user hierarchy | Authenticated | All (filtered by role) |
| GET | `/users/promotable` | Get promotable users | User management | CEO, HOO, HR, Super Admin |
| GET | `/users/available-roles` | Get assignable roles | User management | CEO, HOO, HR, Super Admin |
| POST | `/users/:userId/promote` | Promote user to higher role | User management | CEO, HOO, HR, Super Admin |
| POST | `/users/:userId/demote` | Demote user to lower role | User management | CEO, HOO, HR, Super Admin |
| DELETE | `/users/:userId` | Remove user from system | User management | CEO, HOO, HR, Super Admin |
| GET | `/users/super-admin/verify` | Verify Super Admin count | Super Admin only | Super Admin |

**Notes:**
- Super Admin can manage all users
- CEO can manage HOO, HR, ADMIN, STAFF
- HOO can manage ADMIN/STAFF in OPS department
- HR can manage ADMIN/STAFF in HR department
- User removal requires task reassignment if user has tasks
- Super Admins cannot be removed

---

### 3. Projects (`/api/projects`)

| DELETE | `/projects/:id` | Archive project | `ADMINISTER_PROJECT` | CEO, HOO, HR, Creator |

**Notes:**

- Only CEO, HOO, HR, and ADMIN can create projects
- Users see only projects they're members of (unless CEO/HOO)
- Project creator automatically gets PROJECT_ADMIN role
| DELETE | `/projects/:id` | Archive project | `ADMINISTER_PROJECT` | CEO, HOO, HR, Creator |

**Notes:**
- Only CEO, HOO, HR, and ADMIN can create projects
- Users see only projects they're members of (unless CEO/HOO)
- Project creator automatically gets PROJECT_ADMIN role

---

### 4. Project Members (`/api/projects/:projectId/members`)
| GET | `/:projectId/assignable-users` | Get assignable users | `BROWSE_PROJECT` | All project members |

**Notes:**

- Only PROJECT_ADMIN, PROJECT_LEAD, and DEVELOPER roles can be assigned to tasks
- Removing last PROJECT_ADMIN is prevented
| PATCH | `/:projectId/members/:memberId` | Update member role | `ADMINISTER_PROJECT` | PROJECT_ADMIN |
| DELETE | `/:projectId/members/:memberId` | Remove member | `ADMINISTER_PROJECT` | PROJECT_ADMIN |
| GET | `/:projectId/assignable-users` | Get assignable users | `BROWSE_PROJECT` | All project members |

**Notes:**
- Only PROJECT_ADMIN, PROJECT_LEAD, and DEVELOPER roles can be assigned to tasks
- Removing last PROJECT_ADMIN is prevented

---

### 5. Tasks/Issues (`/api/tasks`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| POST | `/tasks/personal` | Create personal task | Authenticated | All |
| POST | `/tasks` | Create project task | `CREATE_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD, DEVELOPER, REPORTER |
| GET | `/tasks` | List all tasks | Authenticated | All (filtered by role) |
| GET | `/tasks/:id` | Get task by ID | `BROWSE_PROJECT` | All project members |
| PUT | `/tasks/:id` | Update task | `EDIT_OWN_ISSUES` or `EDIT_ALL_ISSUES` | Varies by ownership |
| DELETE | `/tasks/:id` | Delete task | `DELETE_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD |
| PATCH | `/tasks/:id/status` | Change task status (legacy) | Authenticated | Task creator/assignee |
| **POST** | **`/tasks/:id/transition`** | **Workflow-validated status change** | `TRANSITION_ISSUES` | Workflow-based |
| **GET** | **`/tasks/:id/transitions`** | **Get available transitions** | Authenticated | Task creator/assignee |
| POST | `/tasks/:id/assign` | Assign task to user | `ASSIGN_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD |
| POST | `/tasks/:id/approve` | Approve task | - | CEO, HOO, HR |
| POST | `/tasks/:id/reject` | Reject task | - | CEO, HOO, HR |
| **GET** | **`/tasks/board/:projectId`** | **Get Kanban board view** | Authenticated | All project members |
| **POST** | **`/tasks/:id/move`** | **Move task on board** | Authenticated | Task creator/assignee/admins |

**Notes:**
- ⚠️ **Use `/tasks/:id/transition` instead of `/tasks/:id/status`** - validates against workflow rules
- Status transitions follow project workflow type (BASIC, AGILE, BUG_TRACKING)
- `/tasks/:id/transitions` returns only valid next statuses based on workflow + role
- Approval/rejection requires global roles (CEO/HOO/HR)
- **Personal tasks use BASIC workflow by default**
- **Kanban board groups tasks by status categories (TODO, IN_PROGRESS, REVIEW, DONE)**
- **All tasks are auto-positioned for board ordering**

| GET | `/:id/logs` | Get activity logs | `BROWSE_PROJECT` | All project members |

**Notes:**

- Comments support @mentions for user notifications
- Activity logs are auto-generated for task changes
|--------|----------|-------------|-------------|-------|
| POST | `/:id/comments` | Add comment | `ADD_COMMENTS` | PROJECT_ADMIN, PROJECT_LEAD, DEVELOPER, REPORTER |
| GET | `/:id/comments` | Get task comments | `BROWSE_PROJECT` | All project members |
| DELETE | `/:taskId/comments/:commentId` | Delete comment | `DELETE_ALL_COMMENTS` or `DELETE_OWN_COMMENTS` | Varies by ownership |
| GET | `/:id/logs` | Get activity logs | `BROWSE_PROJECT` | All project members |

**Notes:**
- Comments support @mentions for user notifications
- Activity logs are auto-generated for task changes

---
| GET | `/attachments/:id/download` | Download attachment | `BROWSE_PROJECT` | All project members |

**Notes:**

- Supports multipart/form-data file uploads
- Files stored with metadata (filename, size, mime type, uploader)
| POST | `/tasks/:taskId/attachments` | Upload attachment | `CREATE_ATTACHMENTS` | PROJECT_ADMIN, PROJECT_LEAD, DEVELOPER, REPORTER |
| GET | `/tasks/:taskId/attachments` | Get task attachments | `BROWSE_PROJECT` | All project members |
| GET | `/tasks/:taskId/attachments/stats` | Get attachment stats | `BROWSE_PROJECT` | All project members |
| GET | `/attachments/:id` | Get attachment by ID | `BROWSE_PROJECT` | All project members |
| DELETE | `/attachments/:id` | Delete attachment | `DELETE_ALL_ATTACHMENTS` or `DELETE_OWN_ATTACHMENTS` | Varies by ownership |
| GET | `/attachments/:id/download` | Download attachment | `BROWSE_PROJECT` | All project members |

**Notes:**
- Supports multipart/form-data file uploads
- Files stored with metadata (filename, size, mime type, uploader)

---

### 8. Sprints (`/api/sprints`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| GET | `/projects/:projectId/velocity` | Get team velocity | `VIEW_SPRINTS` | All project members |

**Notes:**

- Sprint states: PLANNING → ACTIVE → COMPLETED/CANCELLED
- Only one active sprint per project allowed
- Burndown charts track story points over time
| POST | `/sprints/:sprintId/cancel` | Cancel sprint | `MANAGE_SPRINTS` | PROJECT_ADMIN, PROJECT_LEAD |
| POST | `/sprints/:sprintId/tasks` | Add tasks to sprint | `MANAGE_SPRINTS` | PROJECT_ADMIN, PROJECT_LEAD |
| DELETE | `/sprints/tasks` | Remove tasks from sprint | `MANAGE_SPRINTS` | PROJECT_ADMIN, PROJECT_LEAD |
| GET | `/sprints/:sprintId/burndown` | Get burndown data | `VIEW_SPRINTS` | All project members |
| GET | `/sprints/:sprintId/velocity` | Get sprint velocity | `VIEW_SPRINTS` | All project members |
| GET | `/projects/:projectId/velocity` | Get team velocity | `VIEW_SPRINTS` | All project members |

**Notes:**
- Sprint states: PLANNING → ACTIVE → COMPLETED/CANCELLED
- Only one active sprint per project allowed
- Burndown charts track story points over time

| DELETE | `/tasks/:taskId/epic` | Remove task from epic | Authenticated | Project members |

**Notes:**

- Epics are large user stories spanning multiple sprints
- Tasks can belong to one epic
- Epic progress tracked by child task completion
| POST | `/projects/:projectId/epics` | Create epic | `CREATE_TASKS` | PROJECT_ADMIN, PROJECT_LEAD |
| GET | `/projects/:projectId/epics` | Get project epics | `VIEW_TASKS` | All project members |
| GET | `/epics/:epicId` | Get epic by ID | `VIEW_TASKS` | All project members |
| PUT | `/epics/:epicId` | Update epic | `EDIT_TASKS` | PROJECT_ADMIN, PROJECT_LEAD |
| DELETE | `/epics/:epicId` | Delete epic | `DELETE_TASKS` | PROJECT_ADMIN, PROJECT_LEAD |
| POST | `/epics/:epicId/tasks/:taskId` | Add task to epic | Authenticated | Project members |
| DELETE | `/tasks/:taskId/epic` | Remove task from epic | Authenticated | Project members |

**Notes:**
- Epics are large user stories spanning multiple sprints
- Tasks can belong to one epic
- Epic progress tracked by child task completion

| POST | `/backlog/move-to-sprint` | Move tasks to sprint | `MANAGE_SPRINTS` | PROJECT_ADMIN, PROJECT_LEAD |

**Notes:**

- Backlog contains unscheduled tasks
- "Ready" tasks have estimates and meet DoR (Definition of Ready)
|--------|----------|-------------|-------------|-------|
| GET | `/projects/:projectId/backlog` | Get project backlog | `BROWSE_PROJECT` | All project members |
| POST | `/backlog/prioritize` | Prioritize backlog items | `EDIT_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD |
| POST | `/backlog/estimate` | Estimate story points | `EDIT_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD |
| GET | `/backlog/ready` | Get ready-to-sprint tasks | `BROWSE_PROJECT` | All project members |
| GET | `/backlog/stats` | Get backlog statistics | `BROWSE_PROJECT` | All project members |
| POST | `/backlog/bulk-estimate` | Bulk estimate tasks | `EDIT_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD |
| PATCH | `/backlog/priority` | Update task priority | `EDIT_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD |
| POST | `/backlog/move-to-sprint` | Move tasks to sprint | `MANAGE_SPRINTS` | PROJECT_ADMIN, PROJECT_LEAD |
| PUT | `/board/:boardId/config` | Update board config | `ADMINISTER_PROJECT` | PROJECT_ADMIN |

**Notes:**

- Supports both SCRUM and KANBAN board types
- Board columns map to workflow statuses
- Drag-and-drop represented by move operations

### 10. Board/Kanban (`/api/board`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| GET | `/projects/:projectId/board` | Get Kanban board | `BROWSE_PROJECT` | All project members |
| POST | `/board/move` | Move card on board | `TRANSITION_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD, DEVELOPER |
| GET | `/board/:boardId/config` | Get board configuration | `BROWSE_PROJECT` | All project members |
| PUT | `/board/:boardId/config` | Update board config | `ADMINISTER_PROJECT` | PROJECT_ADMIN |

**Notes:**
| DELETE | `/task-dependencies/:id` | Delete dependency | Authenticated | Project members |

**Dependency Types:**

- `BLOCKS` - This task blocks another
- `IS_BLOCKED_BY` - This task is blocked by another
- `RELATES_TO` - General relationship

**Notes:**

- Prevents circular dependencies
- Blocking info shows if task can be started
| POST | `/task-dependencies` | Create dependency | Authenticated | Project members |
| GET | `/task-dependencies` | Get all dependencies | Authenticated | Project members |
| GET | `/task-dependencies/tasks/:taskId` | Get task dependencies | Authenticated | Project members |
| GET | `/task-dependencies/tasks/:taskId/blocking-info` | Get blocking status | Authenticated | Project members |
| GET | `/task-dependencies/tasks/:taskId/subtask-summary` | Get subtask summary | Authenticated | Project members |
| DELETE | `/task-dependencies/:id` | Delete dependency | Authenticated | Project members |

**Dependency Types:**
- `BLOCKS` - This task blocks another
- `IS_BLOCKED_BY` - This task is blocked by another
- `RELATES_TO` - General relationship

**Notes:**
- Prevents circular dependencies
| GET | `/projects/:projectId/time-summary` | Get project time summary | `BROWSE_PROJECT` | All project members |

**Notes:**

- Timer tracks active work session
- Time entries support descriptions and date overrides
- Users can only edit/delete own time entries (unless PROJECT_ADMIN/PROJECT_LEAD)
| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| POST | `/tasks/:taskId/time` | Log time for task | `WORK_ON_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD, DEVELOPER |
| GET | `/tasks/:taskId/time` | Get task time entries | `BROWSE_PROJECT` | All project members |
| GET | `/time-entries` | Get user time entries | Authenticated | Current user |
| PUT | `/time-entries/:id` | Update time entry | `EDIT_OWN_WORKLOGS` or `EDIT_ALL_WORKLOGS` | Varies by ownership |
| DELETE | `/time-entries/:id` | Delete time entry | `DELETE_OWN_WORKLOGS` or `DELETE_ALL_WORKLOGS` | Varies by ownership |
| POST | `/time/start` | Start timer | `WORK_ON_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD, DEVELOPER |
| POST | `/time/stop` | Stop timer | `WORK_ON_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD, DEVELOPER |
| GET | `/time/active` | Get active timer | Authenticated | Current user |
| GET | `/projects/:projectId/reports/burnup` | Burnup chart data | `BROWSE_PROJECT` | All project members |

**Report Types:**

- **Velocity**: Average story points per sprint
- **Productivity**: Tasks completed, time logged
- **Health**: Completion rate, overdue tasks, team utilization
- **Cycle Time**: Average time from start to completion
- **Burnup**: Cumulative work completed over time
---

### 13. Reports (`/api/projects/:projectId/reports`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| GET | `/projects/:projectId/reports/velocity` | Team velocity report | `BROWSE_PROJECT` | All project members |
| POST | `/search/advanced` | Advanced search | `BROWSE_PROJECT` | All project members |

**JQL Query Examples:**
| GET | `/projects/:projectId/reports/burnup` | Burnup chart data | `BROWSE_PROJECT` | All project members |

**Report Types:**
- **Velocity**: Average story points per sprint
- **Productivity**: Tasks completed, time logged
- **Health**: Completion rate, overdue tasks, team utilization
- **Cycle Time**: Average time from start to completion
- **Burnup**: Cumulative work completed over time

---

### 14. Automation System

The system includes **17 built-in automation rules** that execute automatically based on task events and conditions. These automations are hardcoded into the business logic and run seamlessly in the background.

#### Status-Based Automations

**1. Auto-Progress on First Update**
- **Trigger:** When assignee updates a task in ASSIGNED status
- **Action:** Automatically transitions task to IN_PROGRESS
- **Business Logic:** Signals work has begun

**2. Auto-Review Request**
- **Trigger:** Task status changed to REVIEW
- **Action:** Notifies creator and project lead
- **Business Logic:** Ensures timely review of completed work

**3. Auto-Complete on Approval**
- **Trigger:** Task is approved
- **Action:** Automatically transitions to COMPLETED status
- **Business Logic:** Streamlines approval workflow

**4. Auto-Reject Notification**
- **Trigger:** Task is rejected
- **Action:** Notifies assignee with rejection reason
- **Business Logic:** Provides immediate feedback

#### Priority & Deadline Automations

**5. High-Priority Auto-Notify**
- **Trigger:** Task created with HIGH priority
- **Action:** Immediately notifies assignee
- **Business Logic:** Ensures urgent tasks get attention

**6. Deadline Reminder (24 hours)**
- **Trigger:** Task due within 24 hours (checked hourly via cron job)
- **Action:** Notifies assignee and creator
- **Business Logic:** Prevents missed deadlines
- **Implementation:** `src/jobs/automationJobs.ts` - runs every hour

**7. Overdue Auto-Label**
- **Trigger:** Task past deadline and not completed (checked hourly via cron job)
- **Action:** Automatically adds "OVERDUE" label
- **Business Logic:** Visual indicator for overdue work
- **Implementation:** `src/jobs/automationJobs.ts` - runs every hour

#### Assignment & Collaboration Automations

**8. Assignee Change Notification**
- **Trigger:** Task assignee is changed
- **Action:** Notifies new assignee
- **Business Logic:** Ensures awareness of new responsibilities

**9. Creator as Watcher**
- **Trigger:** Task is created
- **Action:** Automatically adds creator to watchers list
- **Business Logic:** Creator follows task progress

**10. @Mention Auto-Notify**
- **Trigger:** User mentioned in comment (@username)
- **Action:** Sends notification to mentioned user
- **Business Logic:** Direct communication within comments
- **Implementation:** Regex-based mention detection in `CommentService`

#### Approval Workflow Automations

**11. High-Priority Approval Required**
- **Trigger:** HIGH priority task created
- **Action:** Requires PROJECT_LEAD or PROJECT_ADMIN approval
- **Business Logic:** Quality control for critical tasks

**12. CEO Approval for Critical Tasks**
- **Trigger:** Task labeled "CRITICAL"
- **Action:** Routes approval to CEO
- **Business Logic:** Executive oversight on critical work

**13. Multi-Approver for Epics**
- **Trigger:** Epic task created
- **Action:** Requires approval from multiple stakeholders
- **Business Logic:** Consensus on large initiatives

#### Team & Project Automations

**14. Sprint Auto-Complete Blocker**
- **Trigger:** Sprint completion attempted with incomplete tasks
- **Action:** Prevents sprint closure, suggests moving tasks to backlog
- **Business Logic:** Ensures sprint hygiene

**15. Subtask Completion Tracker**
- **Trigger:** All subtasks of parent task completed
- **Action:** Notifies assignee that parent can be completed
- **Business Logic:** Helps track composite work

**16. Blocked Task Alert**
- **Trigger:** Task marked as blocked by dependency
- **Action:** Notifies assignee and project lead
- **Business Logic:** Resolves impediments quickly

**17. Stale Task Reminder**
- **Trigger:** Task in IN_PROGRESS for >7 days without update
- **Action:** Notifies assignee to provide status update
- **Business Logic:** Maintains project visibility

#### Automation Implementation

**Code Locations:**
- **Task Service:** `src/services/TaskService.ts` - Status transitions, approvals, assignments
- **Comment Service:** `src/services/CommentService.ts` - @mention detection and notifications
- **Cron Jobs:** `src/jobs/automationJobs.ts` - Time-based automations (deadline reminders, overdue labeling)

**Cron Job Schedule:**
```typescript
// Runs every hour at minute 0
cron.schedule("0 * * * *", async () => {
  // Check for tasks due within 24 hours
  // Add OVERDUE labels to past-due tasks
});
```

**Technical Details:**
- Automations execute synchronously within business logic
- No API endpoints required (fully integrated)
- Database triggers handled via Prisma middleware
- Notifications queued via NotificationService
- Cron jobs use `node-cron` for scheduling

**Notes:**
- All automations are built-in and cannot be disabled
- No configuration UI or API endpoints
- Designed for consistent, predictable behavior
- Future: Consider making rules configurable per project

---

### 15. Search & Filters (`/api/search`)

- storyPoints, timeSpent

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| GET | `/search` | JQL search | `BROWSE_PROJECT` | All project members |
| POST | `/search/advanced` | Advanced search | `BROWSE_PROJECT` | All project members |

**JQL Query Examples:**
```
project = PROJ1 AND status = "IN_PROGRESS"
assignee = currentUser() AND priority = HIGH
sprint = "Sprint 1" AND type = BUG
created >= 2025-01-01 ORDER BY priority DESC
```
| POST | `/filters/:id/share` | Share filter with project | Authenticated | Filter owner |

**Notes:**

- Filters save JQL queries for reuse
- Can be shared with project members
- Supports favorites and subscriptions

---

### 15. Saved Filters (`/api/filters`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| POST | `/filters` | Create saved filter | Authenticated | All authenticated |
| GET | `/filters` | Get user's filters | Authenticated | Current user |
| POST | `/bulk/delete` | Bulk delete tasks | `DELETE_ISSUES` | PROJECT_ADMIN |

**Notes:**

- Operations apply to multiple tasks at once
- Returns success/failure for each task
- Limited to users with appropriate permissions
**Notes:**
- Filters save JQL queries for reuse
- Can be shared with project members
- Supports favorites and subscriptions

---

### 16. Bulk Operations (`/api/bulk`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| POST | `/bulk/assign` | Bulk assign tasks | `ASSIGN_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD |
| **POST** | **`/bulk/transition`** | **Bulk status change (workflow-validated)** | `TRANSITION_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD |
| POST | `/bulk/update` | Bulk update fields | `EDIT_ISSUES` | PROJECT_ADMIN, PROJECT_LEAD |
| POST | `/bulk/delete` | Bulk delete tasks | `DELETE_ISSUES` | PROJECT_ADMIN |
| POST | `/projects/:projectId/workflow` | Assign workflow to project | `ADMINISTER_PROJECT` | PROJECT_ADMIN |

**Workflow-Validated Bulk Transitions:**

✅ **Each task validated individually** against its project workflow
✅ **Returns detailed results** with successful and failed tasks
✅ **Partial success handling** - some tasks may succeed while others fail

**Response Format:**
```json
{
  "successful": [
    { "id": 1, "title": "Task 1", "oldStatus": "IN_PROGRESS", "newStatus": "REVIEW" }
  ],
  "failed": [
    { "taskId": 2, "reason": "Invalid transition: Cannot move from IN_PROGRESS to COMPLETED in AGILE workflow (must go through REVIEW)" }
  ]
}
```

**Notes:**
- All status changes follow project workflow rules (BASIC, AGILE, BUG_TRACKING)
- Failed transitions return specific error messages with workflow context
- Personal tasks use BASIC workflow by default

---

### 17. Workflows (`/api/projects/:projectId`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| GET | `/projects/:projectId/workflow` | Get project workflow config | `BROWSE_PROJECT` | Project members |
| POST | `/projects/:projectId/workflow` | Update project workflow type | `ADMINISTER_PROJECT` | PROJECT_ADMIN |

**Request Body (POST):**
```json
{
  "workflowType": "AGILE"  // BASIC, AGILE, BUG_TRACKING, CUSTOM
}
```

**Response Example:**
```json
{
  "workflowType": "AGILE",
  "availableStatuses": ["DRAFT", "ASSIGNED", "IN_PROGRESS", "PAUSED", "REVIEW", "COMPLETED", "REJECTED"],
  "transitions": [
    { "from": "DRAFT", "to": "ASSIGNED", "roles": ["PROJECT_ADMIN", "PROJECT_LEAD"] },
    { "from": "ASSIGNED", "to": "IN_PROGRESS", "roles": ["PROJECT_ADMIN", "PROJECT_LEAD", "DEVELOPER"] }
  ]
}
```

**Notes:**
- Each project has one workflow type that governs all tasks
- Changing workflow type affects all future task transitions
- Existing task statuses remain unchanged
- See **Workflow System** section above for transition rules
---

### 18. Permission Schemes (`/api/permission-schemes`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| GET | `/permission-schemes` | Get all schemes | Authenticated | All |
| POST | `/permission-schemes` | Create scheme | - | ADMIN |
| GET | `/permission-schemes/:id` | Get scheme by ID | Authenticated | All |
| PUT | `/permission-schemes/:id` | Update scheme | - | ADMIN |
| DELETE | `/permission-schemes/:id` | Delete scheme | - | ADMIN |
| GET | `/permission-schemes/:id/grants` | Get permission grants | Authenticated | All |
| POST | `/permission-schemes/:id/grants` | Add permission grant | - | ADMIN |
| DELETE | `/permission-schemes/grants/:grantId` | Remove grant | - | ADMIN |
| POST | `/versions/:id/release` | Release version | `ADMINISTER_PROJECT` | PROJECT_ADMIN |

**Notes:**

- **Components**: Logical subsystems (e.g., "Backend", "Frontend", "API")
- **Versions**: Release milestones (e.g., "v1.0", "v2.0")
- Tasks can be assigned to components and fix versions
- Each project assigned one permission scheme
- Default scheme includes standard Jira-like permissions

---

### 19. Components & Versions (`/api/projects/:projectId`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| GET | `/:projectId/components` | Get project components | `BROWSE_PROJECT` | All project members |
| DELETE | `/notifications/:id` | Delete notification | Authenticated | Current user |

**Notification Types:**

- TASK_ASSIGNED
- STATUS_CHANGED
- COMMENT
- MENTION
- APPROVAL_REQUIRED
- APPROVED
- REJECTED
- **Components**: Logical subsystems (e.g., "Backend", "Frontend", "API")
- **Versions**: Release milestones (e.g., "v1.0", "v2.0")
- Tasks can be assigned to components and fix versions

---

### 21. Notifications (`/api/notifications`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| PUT | `/staff/my-profile` | Update my profile | Authenticated | Current user |

**Notes:**

- Staff endpoints provide personalized views
- Available to all authenticated users
- Profile updates limited to name (role/email require admin)
**Notification Types:**
- TASK_ASSIGNED
### 22. Admin Dashboards (`/api/admin`, `/api/ceo`, `/api/hr`)

#### Admin Endpoints (`/api/admin`)

| Method | Endpoint | Description | Permissions | Roles |
- APPROVED
- REJECTED

| GET | `/admin/system/settings` | System settings | - | ADMIN |

#### CEO Endpoints (`/api/ceo`)

| Method | Endpoint | Description | Permissions | Roles |
| Method | Endpoint | Description | Permissions | Roles |
| GET | `/ceo/analytics` | Executive analytics | - | CEO |

#### HR Endpoints (`/api/hr`)

| Method | Endpoint | Description | Permissions | Roles |
| GET | `/staff/my-profile` | Get my profile | Authenticated | Current user |
| PUT | `/staff/my-profile` | Update my profile | Authenticated | Current user |

| GET | `/hr/team-performance` | Team performance metrics | - | HR, CEO |

**Notes:**

- Admin endpoints restricted by global user role
- CEO has access to all admin functions
- HR manages users and team analytics

### 22. Admin Dashboards (`/api/admin`, `/api/ceo`, `/api/hr`)

#### Admin Endpoints (`/api/admin`)
| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| GET | `/admin/projects/overview` | All projects overview | - | ADMIN, CEO, HOO |
| GET | `/admin/users/recent` | Recent user activity | - | ADMIN, HR, CEO |
| GET | `/admin/tasks/pending-approval` | Tasks needing approval | - | ADMIN, CEO, HOO, HR |
| GET | `/admin/system/settings` | System settings | - | ADMIN |

| PATCH | `/users/:id/role` | Change user role | - | CEO, HOO |

**Notes:**

- Only CEO and HOO can change user roles
- Users can update own profile (limited fields)
- Deletion is soft delete (sets isActive=false)
#### HR Endpoints (`/api/hr`)
| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| GET | `/hr/users` | All users management | - | HR, CEO |
| POST | `/hr/users` | Create user | - | HR, CEO |
| PUT | `/hr/users/:id` | Update user | - | HR, CEO |
| Permission | PROJECT_ADMIN | PROJECT_LEAD | DEVELOPER | REPORTER | VIEWER |
|-----------|---------------|--------------|-----------|----------|--------|
| **Project Permissions** | | | | | |
| ADMINISTER_PROJECT | ✅ | ❌ | ❌ | ❌ | ❌ |
- CEO has access to all admin functions
| EDIT_PROJECT | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Issue Permissions** | | | | | |
| CREATE_ISSUES | ✅ | ✅ | ✅ | ✅ | ❌ |

### 23. User Administration (`/api/users`)

| Method | Endpoint | Description | Permissions | Roles |
|--------|----------|-------------|-------------|-------|
| GET | `/users` | Get all users | - | HR, ADMIN, CEO |
| POST | `/users` | Create user | - | HR, ADMIN, CEO |
| GET | `/users/:id` | Get user by ID | Authenticated | All |
| MOVE_ISSUES | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Comment Permissions** | | | | | |
| ADD_COMMENTS | ✅ | ✅ | ✅ | ✅ | ❌ |

**Notes:**
- Only CEO and HOO can change user roles
| DELETE_OWN_COMMENTS | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Attachment Permissions** | | | | | |
| CREATE_ATTACHMENTS | ✅ | ✅ | ✅ | ✅ | ❌ |
---
| DELETE_OWN_ATTACHMENTS | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Time Tracking** | | | | | |
| WORK_ON_ISSUES | ✅ | ✅ | ✅ | ❌ | ❌ |
### Default Permission Scheme

| Permission | PROJECT_ADMIN | PROJECT_LEAD | DEVELOPER | REPORTER | VIEWER |
| DELETE_ALL_WORKLOGS | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Sprint & Epic** | | | | | |
| MANAGE_SPRINTS | ✅ | ✅ | ❌ | ❌ | ❌ |
| BROWSE_PROJECT | ✅ | ✅ | ✅ | ✅ | ✅ |
| EDIT_PROJECT | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Issue Permissions** |
| CREATE_ISSUES | ✅ | ✅ | ✅ | ✅ | ❌ |
| EDIT_ISSUES | ✅ | ✅ | ❌ | ❌ | ❌ |
| EDIT_OWN_ISSUES | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE_ISSUES | ✅ | ✅ | ❌ | ❌ | ❌ |
| DELETE_OWN_ISSUES | ✅ | ✅ | ✅ | ❌ | ❌ |
| ASSIGN_ISSUES | ✅ | ✅ | ❌ | ❌ | ❌ |
| ASSIGNABLE_USER | ✅ | ✅ | ✅ | ❌ | ❌ |
| CLOSE_ISSUES | ✅ | ✅ | ❌ | ❌ | ❌ |
| TRANSITION_ISSUES | ✅ | ✅ | ✅ | ❌ | ❌ |
### Global Roles (Descending Authority)
| **Comment Permissions** |
| ADD_COMMENTS | ✅ | ✅ | ✅ | ✅ | ❌ |
| EDIT_ALL_COMMENTS | ✅ | ✅ | ❌ | ❌ | ❌ |
| EDIT_OWN_COMMENTS | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE_ALL_COMMENTS | ✅ | ✅ | ❌ | ❌ | ❌ |
| DELETE_OWN_COMMENTS | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Attachment Permissions** |
| CREATE_ATTACHMENTS | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE_ALL_ATTACHMENTS | ✅ | ✅ | ❌ | ❌ | ❌ |
| DELETE_OWN_ATTACHMENTS | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Time Tracking** |
| WORK_ON_ISSUES | ✅ | ✅ | ✅ | ❌ | ❌ |
| EDIT_OWN_WORKLOGS | ✅ | ✅ | ✅ | ❌ | ❌ |
- ADMIN manages system settings and configurations
| DELETE_OWN_WORKLOGS | ✅ | ✅ | ✅ | ❌ | ❌ |
### Project Roles (Descending Authority)
| **Sprint & Epic** |
| MANAGE_SPRINTS | ✅ | ✅ | ❌ | ❌ | ❌ |
| VIEW_SPRINTS | ✅ | ✅ | ✅ | ✅ | ✅ |
| MANAGE_EPICS | ✅ | ✅ | ❌ | ❌ | ❌ |
| VIEW_EPICS | ✅ | ✅ | ✅ | ✅ | ✅ |

### Global Role Overrides

**CEO, HOO, HR, and ADMIN** bypass project-level permissions and have **ALL permissions** on **ALL projects**.

---

## Role Hierarchy
- Can customize per project with different schemes
### Global Roles (Descending Authority)

```
CEO (Level 5)
  └─ HOO (Level 4)
      └─ HR (Level 3)
          └─ ADMIN (Level 2)
              └─ STAFF (Level 1)
```

**Rules:**
- Higher roles inherit permissions from lower roles
- CEO and HOO bypass all project restrictions
- HR can manage users and access team analytics
- ADMIN manages system settings and configurations

### Project Roles (Descending Authority)

```
PROJECT_ADMIN (Level 4)
  └─ PROJECT_LEAD (Level 3)
      └─ DEVELOPER (Level 2)
          └─ REPORTER (Level 1)
              └─ VIEWER (Level 0)
```

**Rules:**
- Project creator automatically becomes PROJECT_ADMIN
- Only PROJECT_ADMIN can add/remove members
- Permissions defined by permission scheme
- Can customize per project with different schemes

---

## API Response Formats

### Success Response

```json
{
  "id": "clh123...",
  "name": "Task Title",
  "status": "IN_PROGRESS",
  "createdAt": "2025-11-25T10:00:00Z"
}
```

### Error Response

```json
{
  "error": "Forbidden - You don't have permission to perform this action",
  "code": "PERMISSION_DENIED",
  "requiredPermission": "EDIT_ISSUES"
}
```

## Best Practices

### 1. **Use Appropriate Permissions**

Always check required permissions before attempting operations. Use the permission matrix as reference.

### 2. **Paginate Large Requests**

Use `limit` and `offset` query parameters for large datasets:
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

---

## Common HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT/PATCH/DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource or constraint violation |
| 500 | Internal Server Error | Server-side error |

---

## Best Practices

### 1. **Use Appropriate Permissions**
Always check required permissions before attempting operations. Use the permission matrix as reference.

### 2. **Paginate Large Requests**
Use `limit` and `offset` query parameters for large datasets:
```
GET /api/tasks?limit=50&offset=100
```

### 3. **Filter Results**
Use query parameters to filter:
```
GET /api/tasks?projectId=PROJ1&status=IN_PROGRESS&assignee=user123
```

### 4. **Use JQL for Complex Searches**
For advanced queries, use JQL:
```
GET /api/search?jql=project=PROJ1 AND status IN (IN_PROGRESS,REVIEW) ORDER BY priority DESC
```

### 5. **Bulk Operations for Efficiency**
When updating multiple tasks, use bulk endpoints:
```
POST /api/bulk/assign
{
  "taskIds": ["task1", "task2", "task3"],
  "assigneeId": "user123"
}
```

### 6. **Handle Errors Gracefully**
Always check error responses and handle permission denials:
```javascript
if (response.code === 'PERMISSION_DENIED') {
  console.log(`Missing permission: ${response.requiredPermission}`);
}
```
## Swagger/OpenAPI Documentation

Interactive API documentation available at:
## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanagement

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
- ✅ Authentication testing
# Server
PORT=3000
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (for caching)
REDIS_URL=redis://localhost:6379
```

---

## Swagger/OpenAPI Documentation

Interactive API documentation available at:

```
http://localhost:3000/api-docs
```

The Swagger UI provides:
- ✅ Live API testing
- ✅ Request/response examples
- ✅ Schema definitions
- ✅ Authentication testing

---

## Testing Endpoints

## Rate Limiting

Current rate limits:

- **General API**: 100 requests/minute per user
- **File Upload**: 20 requests/minute per user

Exceeded limits return `429 Too Many Requests`.

# Get tasks (with token)
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Task",
    "description": "Task description",
    "projectId": "project123",
    "priority": "HIGH"
  }'
```

### Using Postman

1. Import the OpenAPI spec from `/api-docs/swagger.json`
2. Set Authorization type to "Bearer Token"
3. Use `{{token}}` variable for authentication
4. Create environment with base URL and token

---

---

## Kanban Board Usage Guide (Jira-Style Workflow)

### Overview

The Kanban board follows **Jira's workflow architecture** where:
- **Status is the source of truth** (DRAFT, ASSIGNED, IN_PROGRESS, etc.)
- **Columns are visual mappings** of status categories
- **Workflow transitions** are validated by state machine rules
- **Drag-and-drop** triggers state transitions (not arbitrary column moves)

This is NOT a simple "Todo/In Progress/Done" system - it's a sophisticated workflow state machine.

### Workflow Types

Each project has a workflow type that determines allowed status transitions:

| Workflow Type | Description | Use Case |
|--------------|-------------|----------|
| **BASIC** | Simple linear workflow | Small projects, simple task tracking |
| **AGILE** | Scrum/Kanban with backlog and review | Software development, agile teams |
| **BUG_TRACKING** | Bug lifecycle management | QA teams, bug reports |
| **CUSTOM** | Database-defined workflow | Enterprise projects with custom needs |

### Status Categories (Column Mapping)

Tasks are grouped into columns based on their **status category**:

| Column | Task Statuses | Description |
|--------|---------------|-------------|
| **To Do** | DRAFT, ASSIGNED | Work that has not started |
| **In Progress** | IN_PROGRESS, PAUSED | Work that is currently being worked on |
| **Review** | REVIEW | Work that is being reviewed or tested |
| **Done** | COMPLETED, REJECTED | Work that is finished |

**Key Concept:** The column is NOT stored - it's calculated from the task's status. When you "move" a task, you're actually transitioning its workflow state.

### 1. Get Kanban Board

**Endpoint:** `GET /api/tasks/board/:projectId`

**Request:**
```bash
curl -X GET "http://localhost:4000/api/tasks/board/project-uuid-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Board retrieved successfully",
  "data": {
    "projectId": "project-uuid-123",
    "projectName": "My Project",
    "projectKey": "PROJ",
    "workflowType": "AGILE",
    "columns": {
      "TODO": {
        "name": "To Do",
        "description": "Work that has not started",
        "statuses": ["DRAFT", "ASSIGNED"],
        "tasks": [
          {
            "id": "task-1",
            "title": "Setup database",
            "status": "DRAFT",
            "priority": "HIGH",
            "position": 0,
            "assignee": {
              "id": "user-1",
              "name": "John Doe",
              "email": "john@example.com"
            },
            "_count": {
              "comments": 3,
              "subTasks": 0
            }
          },
          {
            "id": "task-2",
            "title": "Design UI",
            "status": "ASSIGNED",
            "priority": "MEDIUM",
            "position": 1,
            "assignee": { /* ... */ }
          }
        ]
      },
      "IN_PROGRESS": {
        "name": "In Progress",
        "statuses": ["IN_PROGRESS", "PAUSED"],
        "tasks": [ /* tasks currently being worked on */ ]
      },
      "REVIEW": {
        "name": "Review",
        "statuses": ["REVIEW"],
        "tasks": [ /* tasks in review */ ]
      },
      "DONE": {
        "name": "Done",
        "statuses": ["COMPLETED", "REJECTED"],
        "tasks": [ /* completed or rejected tasks */ ]
      }
    }
  }
}
```

### 2. Create Task (Auto-positioned)

When you create a task, it's automatically positioned at the end of the "To Do" column.

**Endpoint:** `POST /api/tasks`

**Request:**
```bash
curl -X POST "http://localhost:4000/api/tasks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-uuid-123",
    "title": "Implement login feature",
    "description": "Add user authentication with JWT",
    "issueType": "TASK",
    "priority": "HIGH",
    "assigneeId": "user-uuid-456"
  }'
```

**Response:**
```json
{
  "message": "Task created successfully",
  "data": {
    "id": "task-new-uuid",
    "title": "Implement login feature",
    "status": "DRAFT",
    "position": 2,  // Auto-calculated position in To Do column
    "projectId": "project-uuid-123",
    "priority": "HIGH",
    "createdAt": "2025-12-16T10:30:00Z"
  }
}
```

### 3. Move Task (Drag & Drop)

Move a task to a different column by updating its status and position.

**Endpoint:** `POST /api/tasks/:id/move`

**Scenario 1: Move from "To Do" to "In Progress"**
```bash
curl -X POST "http://localhost:4000/api/tasks/task-1/move" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS",
    "position": 0
  }'
```

**Scenario 2: Reorder within same column**
```bash
# Move task from position 2 to position 0 in "To Do"
curl -X POST "http://localhost:4000/api/tasks/task-3/move" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DRAFT",
    "position": 0
  }'
```

**Scenario 3: Move to "Done"**
```bash
curl -X POST "http://localhost:4000/api/tasks/task-1/move" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "position": 0
  }'
```

**Response:**
```json
{
  "message": "Task moved successfully",
  "data": {
    "id": "task-1",
    "title": "Setup database",
    "status": "IN_PROGRESS",
    "position": 0,
    "updatedAt": "2025-12-16T10:35:00Z"
  }
}
```

### 4. Frontend Integration Example

**React/Vue/Angular Implementation:**

```javascript
// 1. Fetch board data
async function loadKanbanBoard(projectId) {
  const response = await fetch(`/api/tasks/board/${projectId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data; // { projectId, projectName, columns }
}

// 2. Handle drag and drop
async function handleTaskDrop(taskId, newStatus, newPosition) {
  const response = await fetch(`/api/tasks/${taskId}/move`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: newStatus,
      position: newPosition
    })
  });
  
  if (response.ok) {
    // Refresh board or update local state
    await loadKanbanBoard(projectId);
  }
}

// 3. Render columns
function renderBoard(boardData) {
  return (
    <div className="kanban-board">
      {Object.entries(boardData.columns).map(([key, column]) => (
        <div key={key} className="kanban-column">
          <h3>{column.name}</h3>
          <div className="tasks">
            {column.tasks.map(task => (
              <TaskCard 
                key={task.id}
                task={task}
                onDrop={(newStatus, newPosition) => 
                  handleTaskDrop(task.id, newStatus, newPosition)
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 5. Status Transition Rules

Tasks can only move to allowed statuses. Invalid transitions are rejected.

**Allowed Transitions:**
```
DRAFT        → ASSIGNED, IN_PROGRESS
ASSIGNED     → IN_PROGRESS, REJECTED
IN_PROGRESS  → PAUSED, REVIEW, COMPLETED
PAUSED       → IN_PROGRESS, REJECTED
REVIEW       → COMPLETED, IN_PROGRESS, REJECTED
COMPLETED    → (terminal - no transitions)
REJECTED     → DRAFT, ASSIGNED
```

**Example Error:**
```bash
# Try to move DRAFT directly to COMPLETED (not allowed)
POST /api/tasks/task-1/move
{
  "status": "COMPLETED",
  "position": 0
}

# Response: 403 Forbidden
{
  "message": "Invalid status transition from DRAFT to COMPLETED"
}
```

### 6. Personal Tasks on Board

Personal tasks (created via `/api/tasks/personal`) are NOT shown on project boards since they have no `projectId`. They can be viewed only through:
- `GET /api/tasks` (filtered to show user's personal tasks)
- Personal dashboard/view (if implemented in frontend)

### 7. Best Practices

✅ **Refresh board after operations** - Always reload board data after creating/moving tasks  
✅ **Validate transitions** - Check allowed transitions before allowing drag-and-drop  
✅ **Use position wisely** - Position 0 is top of column, higher numbers go down  
✅ **Handle errors gracefully** - Show user-friendly messages for invalid moves  
✅ **Real-time updates** - Consider WebSocket for multi-user board updates  
✅ **Optimistic UI** - Update UI immediately, rollback on error  

### 8. Common Use Cases

**Use Case 1: Start Working on a Task**
```bash
# User picks up a task from "To Do"
POST /api/tasks/task-123/move
{ "status": "IN_PROGRESS", "position": 0 }
```

**Use Case 2: Pause Work Temporarily**
```bash
# Task is paused but stays in "In Progress" column
POST /api/tasks/task-123/move
{ "status": "PAUSED", "position": 1 }
```

**Use Case 3: Submit for Review**
```bash
# Move completed work to review
POST /api/tasks/task-123/move
{ "status": "REVIEW", "position": 0 }
```

**Use Case 4: Mark as Complete**
```bash
# After review approval, mark done
POST /api/tasks/task-123/move
{ "status": "COMPLETED", "position": 0 }
```

### 9. Get Available Workflow Transitions

**NEW:** Get valid status transitions for a task based on workflow rules.

**Endpoint:** `GET /api/tasks/:id/transitions`

**Request:**
```bash
curl -X GET "http://localhost:4000/api/tasks/task-123/transitions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Available transitions retrieved successfully",
  "data": {
    "currentStatus": "IN_PROGRESS",
    "workflowType": "AGILE",
    "availableTransitions": [
      {
        "name": "Ready for Review",
        "to": "REVIEW",
        "description": "Submit work for review"
      },
      {
        "name": "Pause Sprint",
        "to": "PAUSED",
        "description": "Temporarily pause work"
      },
      {
        "name": "Block",
        "to": "PAUSED",
        "description": "Blocked by dependency"
      }
    ]
  }
}
```

**Usage in Frontend:**
```javascript
// Fetch available transitions when showing task details
const { data } = await api.get(`/tasks/${taskId}/transitions`);

// Show only valid transitions in dropdown/context menu
data.availableTransitions.forEach(transition => {
  addMenuOption(transition.name, () => {
    moveTask(taskId, transition.to);
  });
});
```

### 10. Get Project Workflow Configuration

**NEW:** Get workflow type and status categories for a project.

**Endpoint:** `GET /api/projects/:projectId/workflow`

**Request:**
```bash
curl -X GET "http://localhost:4000/api/projects/project-123/workflow" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Workflow configuration retrieved successfully",
  "data": {
    "workflowType": "AGILE",
    "statusCategories": {
      "TODO": {
        "name": "To Do",
        "statuses": ["DRAFT", "ASSIGNED"],
        "description": "Work that has not started"
      },
      "IN_PROGRESS": {
        "name": "In Progress",
        "statuses": ["IN_PROGRESS", "PAUSED"],
        "description": "Work that is currently being worked on"
      },
      "REVIEW": {
        "name": "Review",
        "statuses": ["REVIEW"],
        "description": "Work that is being reviewed or tested"
      },
      "DONE": {
        "name": "Done",
        "statuses": ["COMPLETED", "REJECTED"],
        "description": "Work that is finished"
      }
    },
    "allStatuses": [
      "DRAFT", "ASSIGNED", "IN_PROGRESS", "PAUSED", 
      "REVIEW", "COMPLETED", "REJECTED"
    ]
  }
}
```

**Usage in Frontend:**
```javascript
// Initialize board with project workflow
const { data } = await api.get(`/projects/${projectId}/workflow`);

// Create board columns from status categories
Object.entries(data.statusCategories).forEach(([key, category]) => {
  createColumn({
    id: key,
    name: category.name,
    description: category.description,
    acceptedStatuses: category.statuses
  });
});

// Validate drag-and-drop operations
function canDropTask(task, targetColumn) {
  const category = data.statusCategories[targetColumn.id];
  return category.statuses.includes(task.status);
}
```

### 11. Workflow Transition Rules by Type

**BASIC Workflow:**
```
DRAFT → ASSIGNED → IN_PROGRESS → COMPLETED
             ↓          ↓
         REJECTED   PAUSED
```

**AGILE Workflow:**
```
DRAFT → ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED
  ↓        ↓           ↓            ↓
REJECTED  DRAFT      PAUSED      IN_PROGRESS
```

**BUG_TRACKING Workflow:**
```
DRAFT → ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED
  ↓        ↓           ↓            ↓
REJECTED REJECTED   REJECTED   IN_PROGRESS
```

For complete workflow transition rules, see [WORKFLOW_ARCHITECTURE.md](./WORKFLOW_ARCHITECTURE.md).

---

## Rate Limiting

Current rate limits:
- **General API**: 100 requests/minute per user
- **Authentication**: 10 requests/minute per IP
- **File Upload**: 20 requests/minute per user

Exceeded limits return `429 Too Many Requests`.

---

## Support & Resources

- **Swagger Documentation**: `http://localhost:3000/api-docs`
- **Source Code**: GitHub Repository
- **Issue Tracker**: GitHub Issues
- **API Version**: v1.0.0

---

**Generated:** November 26, 2025  
**Total Endpoints:** 158  
**Documentation Coverage:** 100%  
**Format:** Swagger JSDoc (OpenAPI 3.0)
