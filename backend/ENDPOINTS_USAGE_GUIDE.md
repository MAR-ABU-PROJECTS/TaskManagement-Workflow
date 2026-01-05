# Task Management System - Endpoint Usage Guide

**Version:** 2.3.0  
**Last Updated:** December 23, 2025  
**Base URL:** `http://localhost:4000/api`

> 🎉 **Version 2.3.0:** Simplified project roles - only PROJECT_ADMIN (creator) and DEVELOPER (members).
> ⚠️ **API Change:** No `projectRole` field needed when adding members. Roles auto-assigned.
> 🔒 **Breaking:** PROJECT_LEAD, DEVELOPER, DEVELOPER roles removed. Role updates disabled.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Hierarchy Management](#2-user-hierarchy-management)
3. [Projects](#3-projects)
4. [Project Members](#4-project-members)
5. [Tasks](#5-tasks)
6. [Comments & Activity](#6-comments--activity)
7. [Attachments](#7-attachments)
8. [Sprints](#8-sprints)
9. [Epics](#9-epics)
10. [Backlog](#10-backlog)
11. [Kanban Board](#11-kanban-board)
12. [Task Dependencies](#12-task-dependencies)
13. [Time Tracking](#13-time-tracking)
14. [Reports](#14-reports)
15. [Search & JQL](#15-search--jql)
16. [Saved Filters](#16-saved-filters)
17. [Bulk Operations](#16-bulk-operations)
18. [Workflows](#17-workflows)
19. [Permission Schemes](#18-permission-schemes)
20. [Components & Versions](#20-components--versions)
21. [Notifications](#21-notifications)
22. [Admin Dashboards](#22-admin-dashboards)
23. [Role-Specific Endpoints](#23-role-specific-endpoints)
24. [Changelog](#24-changelog)

---

## Changelog - December 21, 2025

### Permission System Updates (v2.1.0)

**ADMIN Role Enhancements:**
- ✅ Can create, update, and delete projects
- ✅ Can add, update, and remove project members
- ✅ Can approve and reject tasks
- ✅ Can assign, unassign, and change task status
- ✅ Can update and delete tasks
- ✅ Full operational access (same as CEO/HOO/HR)

**SUPER_ADMIN Clarification:**
- 🔍 Audit-only role (read access for oversight)
- ❌ Cannot perform write operations
- ❌ Cannot be assigned to operational tasks
- ✅ Can manage user roles (promote/demote)

**Affected Endpoints:**
- `POST /api/projects` - Now includes ADMIN
- `PUT /api/projects/:id` - **Creator only** (v2.1.1 update)
- `DELETE /api/projects/:id` - Now includes ADMIN
- `POST /api/projects/:id/members` - Now includes ADMIN
- `PATCH /api/projects/:id/members/:userId` - Now includes ADMIN
- `DELETE /api/projects/:id/members/:userId` - Now includes ADMIN
- `POST /api/tasks/:id/approve` - Now includes ADMIN
- `POST /api/tasks/:id/reject` - Now includes ADMIN
- `PUT /api/tasks/:id` - **Creator only** (v2.1.1 update)
- `POST /api/tasks/:id/transition` - Now includes ADMIN
- `POST /api/tasks/:id/assign` - Now includes ADMIN
- `DELETE /api/tasks/:id/assign/:userId` - Now includes ADMIN
- `DELETE /api/tasks/:id` - Now includes ADMIN (project members only)

---

## Permissions Quick Reference

### Who Can Do What

| Operation | Allowed Roles |
|-----------|--------------|
| **Create Project** | CEO, HOO, HR, ADMIN |
| **Update Project** | **Project creator only** |
| **Delete Project** | Project creator, CEO, HOO, HR, ADMIN |
| **Add Project Member** | PROJECT_ADMIN, project creator, CEO, HOO, HR, ADMIN |
| **Update Member Role** | PROJECT_ADMIN, project creator, CEO, HOO, HR, ADMIN |
| **Remove Project Member** | PROJECT_ADMIN, project creator, CEO, HOO, HR, ADMIN |
| **Create Task** | All authenticated users |
| **Update Task** | **Task creator only** |
| **Delete Task** | PROJECT_ADMIN (project tasks), task creator (personal tasks), CEO/HOO/HR/ADMIN (if project member) |
| **Assign Task** | Task creator, CEO, HOO, HR, ADMIN |
| **Unassign Task** | Task creator, assignees, PROJECT_ADMIN, CEO, HOO, HR, ADMIN |
| **Change Task Status** | Task creator, assignees, CEO, HOO, HR, ADMIN |
| **Approve Task** | CEO, HOO, HR, ADMIN |
| **Reject Task** | CEO, HOO, HR, ADMIN |

### 👁️ Hierarchical Visibility (v2.2.0)

| Role | Can View |
|------|----------|
| **SUPER_ADMIN** | ✅ Everything (all projects, all tasks, **all personal tasks**) - audit purposes |
| **CEO** | ✅ All projects, all project tasks<br>❌ Cannot see personal tasks |
| **HOO/HR** | ✅ ADMIN + STAFF projects/tasks only<br>❌ Cannot see CEO's projects/tasks unless explicitly added as member/assignee<br>❌ Cannot see personal tasks |
| **ADMIN** | ✅ Only projects they're members of<br>✅ Only tasks they created or are assigned to<br>❌ Cannot see personal tasks of others |
| **STAFF** | ✅ Only projects they're members of<br>✅ Only tasks they created or are assigned to<br>❌ Cannot see personal tasks of others |

**🔒 Personal Tasks (no project):** Only visible to creator + SUPER_ADMIN (audit)

---

## Getting Started

### Base URL
```
http://localhost:4000/api
```

### Authentication
All endpoints except `/auth/login` and `/auth/register` require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Response Format
All responses follow this format:

**Success:**
```json
{
  "id": "clh123...",
  "name": "Task Title",
  "status": "IN_PROGRESS",
  "createdAt": "2025-11-28T10:00:00Z"
}
```

**Error:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 1. Authentication

### 1.1 Register New User

**Endpoint:** `POST /api/auth/register`  
**Auth Required:** ❌ No  
**Description:** Create a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "STAFF",
  "department": "OPS"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "STAFF",
    "department": "OPS"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "clh123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "STAFF"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.2 Login

**Endpoint:** `POST /api/auth/login`  
**Auth Required:** ❌ No  
**Description:** Authenticate and get JWT token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mar.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "clh123",
    "email": "admin@mar.com",
    "name": "Admin User",
    "role": "ADMIN"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the token for subsequent requests!**

---

### 1.3 Get Current User

**Endpoint:** `GET /api/auth/me`  
**Auth Required:** ✅ Yes  
**Description:** Get authenticated user's profile

**Example:**
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "id": "clh123",
  "email": "admin@mar.com",
  "name": "Admin User",
  "role": "ADMIN",
  "department": "OPS",
  "isActive": true,
  "createdAt": "2025-11-28T10:00:00Z"
}
```

---

### 1.4 Logout

**Endpoint:** `POST /api/auth/logout`  
**Auth Required:** ✅ Yes  
**Description:** Logout and log action to audit trail

**Example:**
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Notes:**
- Logs logout action to audit trail with user information
- Client should clear stored tokens after successful logout
- Access token is invalidated (if token blacklisting is enabled)

---

## 2. User Hierarchy Management

### 2.1 Get User Hierarchy

**Endpoint:** `GET /api/users/hierarchy`  
**Auth Required:** ✅ Yes  
**Description:** Get user hierarchy based on current user's permissions

**Visibility Rules:**
- **Super Admin**: Sees all users
- **CEO**: Sees all non-Super Admin users
- **HOO/HR**: Sees users in their department
- **ADMIN/STAFF**: Sees only themselves

**Example:**
```bash
curl -X GET http://localhost:4000/api/users/hierarchy \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "HOO",
      "department": "OPS",
      "isSuperAdmin": false,
      "isActive": true,
      "promotedAt": "2025-12-01T12:00:00Z",
      "promotedBy": {
        "id": "uuid",
        "name": "CEO Name",
        "email": "ceo@example.com",
        "role": "CEO"
      }
    }
  ]
}
```

---

### 2.2 Get Promotable Users

**Endpoint:** `GET /api/users/promotable`  
**Auth Required:** ✅ Yes (CEO, HOO, HR, or Super Admin)  
**Description:** Get users that can be promoted/demoted by current user

**Example:**
```bash
curl -X GET http://localhost:4000/api/users/promotable \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Staff User",
      "email": "staff@example.com",
      "role": "STAFF",
      "department": "OPS"
    }
  ]
}
```

---

### 2.3 Get Available Roles

**Endpoint:** `GET /api/users/available-roles`  
**Auth Required:** ✅ Yes (CEO, HOO, HR, or Super Admin)  
**Description:** Get roles that current user can assign

**Example:**
```bash
curl -X GET http://localhost:4000/api/users/available-roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "roles": ["ADMIN", "STAFF"]
}
```

---

### 2.4 Promote User

**Endpoint:** `POST /api/users/:userId/promote`  
**Auth Required:** ✅ Yes (CEO, HOO, HR, or Super Admin)  
**Description:** Promote a user to a higher role

**Promotion Rules:**
- **Super Admin**: Can promote to any role (CEO, HOO, HR, ADMIN, STAFF)
- **CEO**: Can promote to HOO, HR, ADMIN, STAFF
- **HOO**: Can promote STAFF → ADMIN (OPS department only)
- **HR**: Can promote STAFF → ADMIN (HR department only)

**Request Body:**
```json
{
  "newRole": "ADMIN"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/users/user-uuid/promote \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newRole": "ADMIN"
  }'
```

**Response:**
```json
{
  "message": "User promoted to ADMIN",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "department": "OPS",
    "promotedAt": "2025-12-01T12:00:00Z",
    "promotedBy": {
      "id": "uuid",
      "name": "Manager Name",
      "role": "HOO"
    }
  }
}
```

---

### 2.5 Demote User

**Endpoint:** `POST /api/users/:userId/demote`  
**Auth Required:** ✅ Yes (CEO, HOO, HR, or Super Admin)  
**Description:** Demote a user to a lower role

**Request Body:**
```json
{
  "newRole": "STAFF"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/users/user-uuid/demote \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newRole": "STAFF"
  }'
```

**Response:**
```json
{
  "message": "User demoted to STAFF",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STAFF",
    "department": null
  }
}
```

---

### 2.6 Remove User

**Endpoint:** `DELETE /api/users/:userId`  
**Auth Required:** ✅ Yes (CEO, HOO, HR, or Super Admin)  
**Description:** Remove a user from the system (requires task reassignment if user has tasks)

**Request Body (Optional):**
```json
{
  "reassignToUserId": "uuid-of-target-user"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:4000/api/users/user-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reassignToUserId": "manager-uuid"
  }'
```

**Success Response:**
```json
{
  "message": "User John Doe (user@example.com) removed successfully",
  "tasksReassigned": true,
  "taskCount": 15
}
```

**Error Response (Tasks need reassignment):**
```json
{
  "message": "User has 15 assigned tasks. Please provide reassignToUserId to reassign them before removal.",
  "taskCount": 15,
  "taskIds": ["task-uuid-1", "task-uuid-2"]
}
```

---

### 2.7 Verify Super Admin Count

**Endpoint:** `GET /api/users/super-admin/verify`  
**Auth Required:** ✅ Yes (Super Admin only)  
**Description:** Verify that exactly 2 Super Admins exist in the system

**Example:**
```bash
curl -X GET http://localhost:4000/api/users/super-admin/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "valid": true,
  "count": 2
}
```

---

## 3. Projects

### 2.1 Create Project

**Endpoint:** `POST /api/projects`  
**Auth Required:** ✅ Yes (CEO, HOO, HR, or ADMIN)  
**Description:** Create a new project. Creator automatically becomes PROJECT_ADMIN. Members can be added with userId only (auto-assigned as DEVELOPER).

**Request Body:**
```json
{
  "name": "New Product Launch",
  "description": "Launch our new product line",
  "key": "NPL",
  "workflowSchemeId": "clh456",
  "members": [
    { "userId": "user-id-1" },
    { "userId": "user-id-2" }
  ]
}
```

**Notes:**
- ✅ Creator becomes PROJECT_ADMIN automatically
- ✅ All members in array become DEVELOPER automatically
- ❌ No `role` field needed or accepted
- ❌ Roles cannot be changed after assignment

**Example:**
```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign",
    "description": "Redesign company website",
    "key": "WEB",
    "members": [
      { "userId": "clh123" },
      { "userId": "clh456" }
    ]
  }'
```

**Response:**
```json
{
  "id": "clh789",
  "name": "Website Redesign",
  "description": "Redesign company website",
  "key": "WEB",
  "creatorId": "clh123",
  "createdAt": "2025-11-28T10:00:00Z"
}
```

---

### 2.2 Get All Projects

**Endpoint:** `GET /api/projects`  
**Auth Required:** ✅ Yes  
**Description:** Get all projects (filtered by user access)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search by name or key

**Example:**
```bash
# Get all projects
curl http://localhost:4000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# With pagination
curl "http://localhost:4000/api/projects?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With search
curl "http://localhost:4000/api/projects?search=website" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "projects": [
    {
      "id": "clh789",
      "name": "Website Redesign",
      "key": "WEB",
      "description": "Redesign company website",
      "createdAt": "2025-11-28T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

---

### 2.3 Get Project by ID

**Endpoint:** `GET /api/projects/:id`  
**Auth Required:** ✅ Yes  
**Description:** Get single project details

**Example:**
```bash
curl http://localhost:4000/api/projects/clh789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "id": "clh789",
  "name": "Website Redesign",
  "key": "WEB",
  "description": "Redesign company website",
  "creatorId": "clh123",
  "leadId": "clh456",
  "members": [
    {
      "userId": "clh123",
      "role": "PROJECT_ADMIN",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "createdAt": "2025-11-28T10:00:00Z"
}
```

---

### 2.4 Update Project

**Endpoint:** `PUT /api/projects/:id`  
**Auth Required:** ✅ Yes (Project creator only)  
**Description:** Update project details. Only the project creator can update the project.

**Request Body:**
```json
{
  "name": "Website Redesign v2",
  "description": "Updated description",
  "leadId": "clh999"
}
```

**Example:**
```bash
curl -X PUT http://localhost:4000/api/projects/clh789 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign v2",
    "description": "Complete website overhaul"
  }'
```

---

### 2.5 Delete Project

**Endpoint:** `DELETE /api/projects/:id`  
**Auth Required:** ✅ Yes (CEO, HOO, HR, ADMIN, or project creator)  
**Description:** Archive/delete project

**Example:**
```bash
curl -X DELETE http://localhost:4000/api/projects/clh789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 3. Project Members

### 3.1 Add Member to Project

**Endpoint:** `POST /api/projects/:projectId/members`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN, project creator, or management: CEO/HOO/HR/ADMIN)  
**Description:** Add a user to the project. Member automatically becomes DEVELOPER.

**Request Body:**
```json
{
  "userId": "clh123"
}
```

**Notes:**
- ✅ Member automatically assigned DEVELOPER role
- ❌ No `role` or `projectRole` field needed
- ❌ Only DEVELOPER role available for members

**Example:**
```bash
curl -X POST http://localhost:4000/api/projects/clh789/members \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "clh123"
  }'
```

**Response:**
```json
{
  "message": "Member added successfully",
  "data": {
    "id": "clh111",
    "userId": "clh123",
    "projectId": "clh789",
    "role": "DEVELOPER",
    "addedAt": "2025-12-23T10:00:00Z",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

### 3.2 Get Project Members

**Endpoint:** `GET /api/projects/:projectId/members`  
**Auth Required:** ✅ Yes  
**Description:** List all project members

**Example:**
```bash
curl http://localhost:4000/api/projects/clh789/members \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "members": [
    {
      "id": "clh111",
      "userId": "clh123",
      "projectId": "clh789",
      "role": "PROJECT_ADMIN",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "joinedAt": "2025-11-28T10:00:00Z"
    }
  ]
}
```

---

### 3.3 Update Member Role

**Endpoint:** `PATCH /api/projects/:projectId/members/:memberId`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN, project creator, or management: CEO/HOO/HR/ADMIN)  
**Description:** Change a member's role

**Request Body:**
```json
{
  "role": "PROJECT_ADMIN"
}
```

**Example:**
```bash
curl -X PATCH http://localhost:4000/api/projects/clh789/members/clh111 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "PROJECT_ADMIN"}'
```

---

### 3.4 Remove Member

**Endpoint:** `DELETE /api/projects/:projectId/members/:memberId`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN, project creator, or management: CEO/HOO/HR/ADMIN)  
**Description:** Remove user from project

**Example:**
```bash
curl -X DELETE http://localhost:4000/api/projects/clh789/members/clh111 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 4. Tasks

### 4.1 Create Task

**Endpoint:** `POST /api/tasks`  
**Auth Required:** ✅ Yes  
**Description:** Create a new task/issue

**Request Body:**
```json
{
  "title": "Fix login bug",
  "description": "Users can't login with special characters",
  "projectId": "clh789",
  "type": "BUG",
  "priority": "HIGH",
  "status": "ASSIGNED",
  "assigneeId": "clh123",
  "sprintId": "clh456",
  "storyPoints": 5,
  "deadline": "2025-12-01T00:00:00Z",
  "labels": ["urgent", "security"]
}
```

**Fields:**
- `title` (required): Task title
- `description` (optional): Detailed description
- `projectId` (required): Project ID
- `type` (optional): TASK, BUG, or STORY (default: TASK)
- `priority` (optional): LOW, MEDIUM, or HIGH (default: MEDIUM)
- `status` (optional): DRAFT, ASSIGNED, IN_PROGRESS, PAUSED, REVIEW, COMPLETED, REJECTED
- `assigneeId` (optional): User ID to assign
- `sprintId` (optional): Sprint ID
- `epicId` (optional): Epic ID
- `storyPoints` (optional): Effort estimate
- `deadline` (optional): Due date
- `labels` (optional): Array of labels

**Example:**
```bash
curl -X POST http://localhost:4000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user profile page",
    "description": "Create a page where users can view and edit their profile",
    "projectId": "clh789",
    "type": "TASK",
    "priority": "MEDIUM",
    "assigneeId": "clh123",
    "storyPoints": 8
  }'
```

**Response:**
```json
{
  "id": "clh999",
  "title": "Implement user profile page",
  "description": "Create a page where users can view and edit their profile",
  "projectId": "clh789",
  "type": "TASK",
  "priority": "MEDIUM",
  "status": "ASSIGNED",
  "assigneeId": "clh123",
  "creatorId": "clh456",
  "storyPoints": 8,
  "createdAt": "2025-11-28T10:00:00Z"
}
```

---

### 4.2 Get All Tasks

**Endpoint:** `GET /api/tasks`  
**Auth Required:** ✅ Yes  
**Description:** Get all tasks (filtered by access)

**Query Parameters:**
- `projectId` (optional): Filter by project
- `assigneeId` (optional): Filter by assignee
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `type` (optional): Filter by type
- `sprintId` (optional): Filter by sprint
- `epicId` (optional): Filter by epic
- `page` (optional): Page number
- `limit` (optional): Items per page

**Example:**
```bash
# Get all tasks
curl http://localhost:4000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by project
curl "http://localhost:4000/api/tasks?projectId=clh789" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by assignee and status
curl "http://localhost:4000/api/tasks?assigneeId=clh123&status=IN_PROGRESS" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter high priority bugs
curl "http://localhost:4000/api/tasks?priority=HIGH&type=BUG" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4.3 Get Task by ID

**Endpoint:** `GET /api/tasks/:id`  
**Auth Required:** ✅ Yes  
**Description:** Get single task with full details

**Example:**
```bash
curl http://localhost:4000/api/tasks/clh999 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "id": "clh999",
  "title": "Implement user profile page",
  "description": "Create a page where users can view and edit their profile",
  "projectId": "clh789",
  "project": {
    "name": "Website Redesign",
    "key": "WEB"
  },
  "type": "TASK",
  "priority": "MEDIUM",
  "status": "IN_PROGRESS",
  "assigneeId": "clh123",
  "assignee": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "creatorId": "clh456",
  "creator": {
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "storyPoints": 8,
  "labels": ["frontend", "user-experience"],
  "createdAt": "2025-11-28T10:00:00Z",
  "updatedAt": "2025-11-28T11:00:00Z"
}
```

---

### 4.4 Update Task

**Endpoint:** `PUT /api/tasks/:id`  
**Auth Required:** ✅ Yes (Task creator only)  
**Description:** Update task details. Only the task creator can update the task.

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "storyPoints": 10
}
```

**Example:**
```bash
curl -X PUT http://localhost:4000/api/tasks/clh999 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REVIEW",
    "description": "Profile page completed, ready for review"
  }'
```

---

### 4.5 Delete Task

**Endpoint:** `DELETE /api/tasks/:id`  
**Auth Required:** ✅ Yes  
**Description:** Delete a task (with permission checks)

**Permission Rules:**
- **PROJECT_ADMIN / PROJECT_ADMIN**: Can delete any task in their project
- **Task Creator**: Can delete their own personal tasks
- **Global Admins (CEO/HOO/HR/SUPER_ADMIN)**: Can delete any task

**Example:**
```bash
curl -X DELETE http://localhost:4000/api/tasks/clh999 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

**Notes:**
- Logs deletion to activity log
- Deletes all associated comments, attachments, and activity logs
- Cannot be undone - ensure confirmation before deletion

---

### 4.6 Assign Task

**Endpoint:** `POST /api/tasks/:id/assign`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN or PROJECT_ADMIN)  
**Description:** Assign task to a user

**Request Body:**
```json
{
  "assigneeId": "clh123"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/tasks/clh999/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assigneeId": "clh123"}'
```

---

### 4.7 Approve Task

**Endpoint:** `POST /api/tasks/:id/approve`  
**Auth Required:** ✅ Yes (CEO, HOO, or HR only)  
**Description:** Approve a task (auto-completes it)

**Example:**
```bash
curl -X POST http://localhost:4000/api/tasks/clh999/approve \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4.8 Reject Task

**Endpoint:** `POST /api/tasks/:id/reject`  
**Auth Required:** ✅ Yes (CEO, HOO, or HR only)  
**Description:** Reject a task with reason

**Request Body:**
```json
{
  "reason": "Does not meet quality standards"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/tasks/clh999/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Needs more testing"}'
```

---

## 5. Comments & Activity

### 5.1 Add Comment

**Endpoint:** `POST /api/tasks/:id/comments`  
**Auth Required:** ✅ Yes  
**Description:** Add a comment to a task

**Request Body:**
```json
{
  "content": "This looks good! @john please review"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/tasks/clh999/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Added the requested changes @jane"
  }'
```

**Response:**
```json
{
  "id": "clh888",
  "content": "Added the requested changes @jane",
  "taskId": "clh999",
  "authorId": "clh123",
  "author": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "createdAt": "2025-11-28T10:00:00Z"
}
```

**Note:** Use `@username` to mention users - they'll get notified!

---

### 5.2 Get Task Comments

**Endpoint:** `GET /api/tasks/:id/comments`  
**Auth Required:** ✅ Yes  
**Description:** Get all comments for a task

**Example:**
```bash
curl http://localhost:4000/api/tasks/clh999/comments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5.3 Update Comment

**Endpoint:** `PUT /api/tasks/:taskId/comments/:commentId`  
**Auth Required:** ✅ Yes (comment author only)  
**Description:** Edit your own comment

**Request Body:**
```json
{
  "content": "Updated comment text"
}
```

**Example:**
```bash
curl -X PUT http://localhost:4000/api/tasks/clh999/comments/clh888 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated: Changes are complete"}'
```

---

### 5.4 Delete Comment

**Endpoint:** `DELETE /api/tasks/:taskId/comments/:commentId`  
**Auth Required:** ✅ Yes (comment author or PROJECT_ADMIN)  
**Description:** Delete a comment

**Example:**
```bash
curl -X DELETE http://localhost:4000/api/tasks/clh999/comments/clh888 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5.5 Get Activity Logs

**Endpoint:** `GET /api/tasks/:id/logs`  
**Auth Required:** ✅ Yes  
**Description:** Get full activity history for a task

**Example:**
```bash
curl http://localhost:4000/api/tasks/clh999/logs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "logs": [
    {
      "id": "clh777",
      "action": "STATUS_UPDATE",
      "details": "Changed status from ASSIGNED to IN_PROGRESS",
      "userId": "clh123",
      "user": {
        "name": "John Doe"
      },
      "createdAt": "2025-11-28T10:00:00Z"
    },
    {
      "id": "clh778",
      "action": "COMMENT",
      "details": "Added comment",
      "userId": "clh456",
      "createdAt": "2025-11-28T11:00:00Z"
    }
  ]
}
```

---

## 6. Attachments

### 6.1 Upload Attachment

**Endpoint:** `POST /api/tasks/:taskId/attachments`  
**Auth Required:** ✅ Yes  
**Description:** Upload a file to a task

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: The file to upload (max 10MB)

**Example:**
```bash
curl -X POST http://localhost:4000/api/tasks/clh999/attachments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/screenshot.png"
```

**Response:**
```json
{
  "id": "clh666",
  "filename": "screenshot.png",
  "originalName": "screenshot.png",
  "mimeType": "image/png",
  "size": 245678,
  "url": "/uploads/screenshot-1234567890.png",
  "taskId": "clh999",
  "uploadedById": "clh123",
  "createdAt": "2025-11-28T10:00:00Z"
}
```

---

### 6.2 Get Task Attachments

**Endpoint:** `GET /api/tasks/:taskId/attachments`  
**Auth Required:** ✅ Yes  
**Description:** List all attachments for a task

**Example:**
```bash
curl http://localhost:4000/api/tasks/clh999/attachments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6.3 Download Attachment

**Endpoint:** `GET /api/attachments/:id/download`  
**Auth Required:** ✅ Yes  
**Description:** Download a file

**Example:**
```bash
curl http://localhost:4000/api/attachments/clh666/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o downloaded-file.png
```

---

### 6.4 Delete Attachment

**Endpoint:** `DELETE /api/attachments/:id`  
**Auth Required:** ✅ Yes (uploader or PROJECT_ADMIN)  
**Description:** Delete an attachment

**Example:**
```bash
curl -X DELETE http://localhost:4000/api/attachments/clh666 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 7. Sprints

### 7.1 Create Sprint

**Endpoint:** `POST /api/projects/:projectId/sprints`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN or PROJECT_ADMIN)  
**Description:** Create a new sprint

**Request Body:**
```json
{
  "name": "Sprint 1",
  "goal": "Complete user authentication",
  "startDate": "2025-12-01T00:00:00Z",
  "endDate": "2025-12-14T23:59:59Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/projects/clh789/sprints \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sprint 1",
    "goal": "Launch MVP features",
    "startDate": "2025-12-01T00:00:00Z",
    "endDate": "2025-12-14T23:59:59Z"
  }'
```

---

### 7.2 Start Sprint

**Endpoint:** `POST /api/sprints/:sprintId/start`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN or PROJECT_ADMIN)  
**Description:** Activate a sprint (only one active sprint per project)

**Example:**
```bash
curl -X POST http://localhost:4000/api/sprints/clh555/start \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 7.3 Complete Sprint

**Endpoint:** `POST /api/sprints/:sprintId/complete`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN or PROJECT_ADMIN)  
**Description:** Close a sprint

**Example:**
```bash
curl -X POST http://localhost:4000/api/sprints/clh555/complete \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 7.4 Add Tasks to Sprint

**Endpoint:** `POST /api/sprints/:sprintId/tasks`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN or PROJECT_ADMIN)  
**Description:** Add tasks to a sprint

**Request Body:**
```json
{
  "taskIds": ["clh999", "clh888", "clh777"]
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/sprints/clh555/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskIds": ["clh999", "clh888"]
  }'
```

---

### 7.5 Get Sprint Burndown Chart

**Endpoint:** `GET /api/sprints/:sprintId/burndown`  
**Auth Required:** ✅ Yes  
**Description:** Get burndown chart data for sprint

**Example:**
```bash
curl http://localhost:4000/api/sprints/clh555/burndown \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "sprint": {
    "id": "clh555",
    "name": "Sprint 1",
    "startDate": "2025-12-01",
    "endDate": "2025-12-14"
  },
  "data": [
    {
      "date": "2025-12-01",
      "remaining": 100,
      "ideal": 100
    },
    {
      "date": "2025-12-02",
      "remaining": 92,
      "ideal": 93
    }
  ]
}
```

---

## 8. Epics

### 8.1 Create Epic

**Endpoint:** `POST /api/projects/:projectId/epics`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN or PROJECT_ADMIN)  
**Description:** Create an epic (large user story)

**Request Body:**
```json
{
  "title": "User Authentication System",
  "description": "Complete user authentication and authorization",
  "priority": "HIGH"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/projects/clh789/epics \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Payment Integration",
    "description": "Integrate Stripe payment system",
    "priority": "HIGH"
  }'
```

---

### 8.2 Add Task to Epic

**Endpoint:** `POST /api/epics/:epicId/tasks/:taskId`  
**Auth Required:** ✅ Yes  
**Description:** Link a task to an epic

**Example:**
```bash
curl -X POST http://localhost:4000/api/epics/clh444/tasks/clh999 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 8.3 Get Epic Tasks

**Endpoint:** `GET /api/epics/:epicId`  
**Auth Required:** ✅ Yes  
**Description:** Get epic with all its tasks

**Example:**
```bash
curl http://localhost:4000/api/epics/clh444 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 9. Backlog

### 9.1 Get Project Backlog

**Endpoint:** `GET /api/projects/:projectId/backlog`  
**Auth Required:** ✅ Yes  
**Description:** Get all unscheduled tasks

**Example:**
```bash
curl http://localhost:4000/api/projects/clh789/backlog \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 9.2 Prioritize Backlog

**Endpoint:** `POST /api/backlog/prioritize`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN or PROJECT_ADMIN)  
**Description:** Reorder backlog items

**Request Body:**
```json
{
  "projectId": "clh789",
  "taskIds": ["clh999", "clh888", "clh777"]
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/backlog/prioritize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "clh789",
    "taskIds": ["clh999", "clh888"]
  }'
```

---

### 9.3 Estimate Story Points

**Endpoint:** `POST /api/backlog/estimate`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN or PROJECT_ADMIN)  
**Description:** Add story point estimates

**Request Body:**
```json
{
  "taskId": "clh999",
  "storyPoints": 8
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/backlog/estimate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "clh999",
    "storyPoints": 5
  }'
```

---

## 10. Kanban Board

### 10.1 Get Board

**Endpoint:** `GET /api/projects/:projectId/board`  
**Auth Required:** ✅ Yes  
**Description:** Get Kanban board with tasks organized by status

**Example:**
```bash
curl http://localhost:4000/api/projects/clh789/board \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "board": {
    "id": "clh333",
    "projectId": "clh789",
    "type": "SCRUM"
  },
  "columns": {
    "DRAFT": [
      { "id": "task1", "title": "Task 1" }
    ],
    "IN_PROGRESS": [
      { "id": "task2", "title": "Task 2" }
    ],
    "REVIEW": [],
    "COMPLETED": [
      { "id": "task3", "title": "Task 3" }
    ]
  }
}
```

---

### 10.2 Move Task on Board

**Endpoint:** `POST /api/board/move`  
**Auth Required:** ✅ Yes  
**Description:** Move a task to different column (changes status)

**Request Body:**
```json
{
  "taskId": "clh999",
  "newStatus": "IN_PROGRESS"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/board/move \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "clh999",
    "newStatus": "REVIEW"
  }'
```

---

## 11. Task Dependencies

### 11.1 Create Dependency

**Endpoint:** `POST /api/task-dependencies`  
**Auth Required:** ✅ Yes  
**Description:** Create a dependency between tasks

**Request Body:**
```json
{
  "taskId": "clh999",
  "dependsOnTaskId": "clh888",
  "type": "BLOCKS"
}
```

**Dependency Types:**
- `BLOCKS` - This task blocks another
- `IS_BLOCKED_BY` - This task is blocked by another
- `RELATES_TO` - General relationship

**Example:**
```bash
curl -X POST http://localhost:4000/api/task-dependencies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "clh999",
    "dependsOnTaskId": "clh888",
    "type": "IS_BLOCKED_BY"
  }'
```

---

### 11.2 Get Task Dependencies

**Endpoint:** `GET /api/task-dependencies/tasks/:taskId`  
**Auth Required:** ✅ Yes  
**Description:** Get all dependencies for a task

**Example:**
```bash
curl http://localhost:4000/api/task-dependencies/tasks/clh999 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 12. Time Tracking

### 12.1 Start Timer

**Endpoint:** `POST /api/time/start`  
**Auth Required:** ✅ Yes  
**Description:** Start tracking time for a task

**Request Body:**
```json
{
  "taskId": "clh999"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/time/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "clh999"}'
```

---

### 12.2 Stop Timer

**Endpoint:** `POST /api/time/stop`  
**Auth Required:** ✅ Yes  
**Description:** Stop the active timer

**Example:**
```bash
curl -X POST http://localhost:4000/api/time/stop \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 12.3 Log Time Manually

**Endpoint:** `POST /api/tasks/:taskId/time`  
**Auth Required:** ✅ Yes  
**Description:** Manually log time spent

**Request Body:**
```json
{
  "timeSpent": 3600,
  "description": "Implemented login form",
  "date": "2025-11-28T10:00:00Z"
}
```

**Note:** `timeSpent` is in seconds (3600 = 1 hour)

**Example:**
```bash
curl -X POST http://localhost:4000/api/tasks/clh999/time \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timeSpent": 7200,
    "description": "Fixed authentication bug"
  }'
```

---

### 12.4 Get Time Entries

**Endpoint:** `GET /api/tasks/:taskId/time`  
**Auth Required:** ✅ Yes  
**Description:** Get all time entries for a task

**Example:**
```bash
curl http://localhost:4000/api/tasks/clh999/time \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 13. Reports

### 13.1 Velocity Report

**Endpoint:** `GET /api/projects/:projectId/reports/velocity`  
**Auth Required:** ✅ Yes  
**Description:** Get team velocity (story points per sprint)

**Example:**
```bash
curl http://localhost:4000/api/projects/clh789/reports/velocity \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "project": {
    "id": "clh789",
    "name": "Website Redesign"
  },
  "sprints": [
    {
      "name": "Sprint 1",
      "completed": 45,
      "planned": 50
    },
    {
      "name": "Sprint 2",
      "completed": 52,
      "planned": 50
    }
  ],
  "averageVelocity": 48.5
}
```

---

### 13.2 Productivity Report

**Endpoint:** `GET /api/projects/:projectId/reports/productivity`  
**Auth Required:** ✅ Yes  
**Description:** Get team productivity metrics

**Example:**
```bash
curl http://localhost:4000/api/projects/clh789/reports/productivity \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 13.3 Burnup Chart

**Endpoint:** `GET /api/projects/:projectId/reports/burnup`  
**Auth Required:** ✅ Yes  
**Description:** Get cumulative work completed over time

**Example:**
```bash
curl http://localhost:4000/api/projects/clh789/reports/burnup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 14. Search & JQL

### 14.1 Basic Search

**Endpoint:** `GET /api/search`  
**Auth Required:** ✅ Yes  
**Description:** Search tasks with JQL query

**Query Parameters:**
- `jql`: JQL query string

**JQL Examples:**
```
project = WEB AND status = "IN_PROGRESS"
assignee = currentUser() AND priority = HIGH
sprint = "Sprint 1" AND type = BUG
created >= 2025-11-01 ORDER BY priority DESC
```

**Example:**
```bash
# Search for your high-priority tasks
curl "http://localhost:4000/api/search?jql=assignee%20%3D%20currentUser()%20AND%20priority%20%3D%20HIGH" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search for bugs in project
curl "http://localhost:4000/api/search?jql=project%20%3D%20WEB%20AND%20type%20%3D%20BUG" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 14.2 Advanced Search

**Endpoint:** `POST /api/search/advanced`  
**Auth Required:** ✅ Yes  
**Description:** Advanced search with filters

**Request Body:**
```json
{
  "projectId": "clh789",
  "status": ["IN_PROGRESS", "REVIEW"],
  "priority": ["HIGH"],
  "assigneeId": "clh123",
  "createdAfter": "2025-11-01",
  "createdBefore": "2025-11-30"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/search/advanced \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "clh789",
    "status": ["IN_PROGRESS"],
    "priority": ["HIGH", "MEDIUM"]
  }'
```

---

## 15. Saved Filters

### 15.1 Create Filter

**Endpoint:** `POST /api/filters`  
**Auth Required:** ✅ Yes  
**Description:** Save a search query for reuse

**Request Body:**
```json
{
  "name": "My High Priority Tasks",
  "description": "All my high priority tasks",
  "jql": "assignee = currentUser() AND priority = HIGH",
  "isFavorite": true
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/filters \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Bugs",
    "jql": "assignee = currentUser() AND type = BUG"
  }'
```

---

### 15.2 Get My Filters

**Endpoint:** `GET /api/filters`  
**Auth Required:** ✅ Yes  
**Description:** Get all your saved filters

**Example:**
```bash
curl http://localhost:4000/api/filters \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 15.3 Execute Filter

**Endpoint:** `GET /api/filters/:id/execute`  
**Auth Required:** ✅ Yes  
**Description:** Run a saved filter

**Example:**
```bash
curl http://localhost:4000/api/filters/clh222/execute \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 16. Bulk Operations

### 16.1 Bulk Assign

**Endpoint:** `POST /api/bulk/assign`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN or PROJECT_ADMIN)  
**Description:** Assign multiple tasks at once

**Request Body:**
```json
{
  "taskIds": ["clh999", "clh888", "clh777"],
  "assigneeId": "clh123"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/bulk/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskIds": ["clh999", "clh888"],
    "assigneeId": "clh123"
  }'
```

---

### 16.2 Bulk Status Change (Workflow-Validated)

**Endpoint:** `POST /api/bulk/transition`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN or PROJECT_ADMIN)  
**Description:** Change status of multiple tasks with workflow validation

> 🔒 **Workflow Validation:** Each task is validated individually against its project's workflow rules.
> Tasks that fail validation are returned in the 'failed' array with detailed reasons.

**Request Body:**
```json
{
  "taskIds": ["clh999", "clh888"],
  "status": "REVIEW"
}
```

**Response:**
```json
{
  "message": "2 of 3 tasks transitioned to REVIEW",
  "successful": ["clh999", "clh888"],
  "failed": [
    {
      "taskId": "clh777",
      "reason": "Invalid transition from DRAFT to REVIEW in AGILE workflow"
    }
  ],
  "totalRequested": 3,
  "totalSuccessful": 2,
  "totalFailed": 1
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/bulk/transition \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskIds": ["clh999", "clh888"],
    "status": "IN_PROGRESS"
  }'
```

**Valid Status Values:**
- `DRAFT` - Initial draft state
- `ASSIGNED` - Task assigned to someone
- `IN_PROGRESS` - Work in progress
- `PAUSED` - Work temporarily stopped
- `REVIEW` - Under review/testing
- `COMPLETED` - Work finished successfully
- `REJECTED` - Task rejected/closed

---

### 16.3 Bulk Update

**Endpoint:** `POST /api/bulk/update`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN or PROJECT_ADMIN)  
**Description:** Update multiple tasks with same changes

**Request Body:**
```json
{
  "taskIds": ["clh999", "clh888"],
  "updates": {
    "priority": "HIGH",
    "labels": ["urgent"]
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/bulk/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskIds": ["clh999", "clh888"],
    "updates": {
      "priority": "LOW",
      "sprintId": "clh555"
    }
  }'
```

---

## 17. Workflows

> 🎯 **Jira-Style Workflow System:** Tasks follow workflow state machines with validated transitions.
> Each project has a workflow type (BASIC, AGILE, BUG_TRACKING, CUSTOM) that determines allowed status transitions.

### 17.1 Get Project Workflow

**Endpoint:** `GET /api/projects/:projectId/workflow`  
**Auth Required:** ✅ Yes  
**Description:** Get workflow configuration for a project (NEW)

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
        "description": "Work currently being worked on"
      },
      "REVIEW": {
        "name": "Review",
        "statuses": ["REVIEW"],
        "description": "Work being reviewed or tested"
      },
      "DONE": {
        "name": "Done",
        "statuses": ["COMPLETED", "REJECTED"],
        "description": "Work that is finished"
      }
    },
    "allStatuses": ["DRAFT", "ASSIGNED", "IN_PROGRESS", "PAUSED", "REVIEW", "COMPLETED", "REJECTED"]
  }
}
```

**Example:**
```bash
curl http://localhost:4000/api/projects/clh123/workflow \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 17.2 Get Available Transitions for Task

**Endpoint:** `GET /api/tasks/:id/transitions`  
**Auth Required:** ✅ Yes  
**Description:** Get valid status transitions for a specific task (NEW)

> 💡 **Use Case:** Show only valid actions in UI based on workflow rules and user permissions.

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
        "to": "PAUSED"
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

**Example:**
```bash
curl http://localhost:4000/api/tasks/clh999/transitions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 17.3 Transition Task Status

**Endpoint:** `POST /api/tasks/:id/transition`  
**Auth Required:** ✅ Yes  
**Description:** Change task status (workflow-validated)

> 🔒 **Validation:** Transitions are validated against project workflow rules.

**Request Body:**
```json
{
  "status": "REVIEW",
  "comment": "Ready for code review" // Optional
}
```

**Fields:**
- `status` (required): Target status (e.g., REVIEW, COMPLETED)
- `comment` (optional): Additional context for the transition

**Example:**
```bash
# Without comment
curl -X POST http://localhost:4000/api/tasks/clh999/transition \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "REVIEW"}'

# With comment
curl -X POST http://localhost:4000/api/tasks/clh999/transition \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "REVIEW", "comment": "Completed all unit tests"}'
```

---

### 17.4 Move Task on Board

**Endpoint:** `POST /api/tasks/:id/move`  
**Auth Required:** ✅ Yes  
**Description:** Move task to different status/position (drag-and-drop)

> 🎯 **Board Operations:** Updates both status and position for Kanban board.

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "position": 0
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/tasks/clh999/move \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS", "position": 0}'
```

---

### 17.5 Workflow Types

**BASIC Workflow:**
```
DRAFT → ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED
```

**AGILE Workflow:**
```
DRAFT → ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED
(includes backlog management and iterative review)
```

**BUG_TRACKING Workflow:**
```
DRAFT (New) → ASSIGNED (Confirmed) → IN_PROGRESS (Fixing) → REVIEW (Testing) → COMPLETED (Closed)
```

---

### 17.6 Get Workflow Schemes

**Endpoint:** `GET /api/workflows`  
**Auth Required:** ✅ Yes  
**Description:** Get all workflow schemes

**Example:**
```bash
curl http://localhost:4000/api/workflows \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 17.7 Create Workflow

**Endpoint:** `POST /api/workflows`  
**Auth Required:** ✅ Yes (ADMIN only)  
**Description:** Create a custom workflow scheme

**Request Body:**
```json
{
  "name": "Development Workflow",
  "description": "Custom workflow for development tasks",
  "statuses": ["DRAFT", "IN_PROGRESS", "CODE_REVIEW", "QA", "DONE"],
  "transitions": [
    {
      "from": "DRAFT",
      "to": "IN_PROGRESS",
      "name": "Start Work"
    },
    {
      "from": "IN_PROGRESS",
      "to": "CODE_REVIEW",
      "name": "Submit for Review"
    }
  ]
}
```

---

### 17.3 Get Project Workflow

**Endpoint:** `GET /api/projects/:projectId/workflow`  
**Auth Required:** ✅ Yes  
**Description:** Get workflow assigned to project

**Example:**
```bash
curl http://localhost:4000/api/projects/clh789/workflow \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 18. Permission Schemes

### 18.1 Get Permission Schemes

**Endpoint:** `GET /api/permission-schemes`  
**Auth Required:** ✅ Yes  
**Description:** Get all permission schemes

**Example:**
```bash
curl http://localhost:4000/api/permission-schemes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 18.2 Create Permission Scheme

**Endpoint:** `POST /api/permission-schemes`  
**Auth Required:** ✅ Yes (ADMIN only)  
**Description:** Create custom permission scheme

**Request Body:**
```json
{
  "name": "Open Source Project Permissions",
  "description": "Permissions for open source projects",
  "grants": [
    {
      "permission": "CREATE_ISSUES",
      "role": "DEVELOPER"
    },
    {
      "permission": "EDIT_ISSUES",
      "role": "DEVELOPER"
    }
  ]
}
```

---

## 19. Components & Versions

### 19.1 Create Component

**Endpoint:** `POST /api/projects/:projectId/components`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN)  
**Description:** Create a component (subsystem)

**Request Body:**
```json
{
  "name": "Backend API",
  "description": "REST API backend",
  "leadId": "clh123"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/projects/clh789/components \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Frontend",
    "description": "React frontend application"
  }'
```

---

### 19.2 Create Version

**Endpoint:** `POST /api/projects/:projectId/versions`  
**Auth Required:** ✅ Yes (PROJECT_ADMIN)  
**Description:** Create a release version

**Request Body:**
```json
{
  "name": "v1.0.0",
  "description": "First major release",
  "releaseDate": "2025-12-31T00:00:00Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/projects/clh789/versions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "v2.0.0",
    "description": "Second major release"
  }'
```

---

## 20. Notifications

### 20.1 Get Notifications

**Endpoint:** `GET /api/notifications`  
**Auth Required:** ✅ Yes  
**Description:** Get your notifications

**Query Parameters:**
- `unreadOnly` (optional): true/false
- `page` (optional): Page number
- `limit` (optional): Items per page

**Example:**
```bash
# Get all notifications
curl http://localhost:4000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get unread only
curl "http://localhost:4000/api/notifications?unreadOnly=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 20.2 Mark as Read

**Endpoint:** `PATCH /api/notifications/:id/read`  
**Auth Required:** ✅ Yes  
**Description:** Mark notification as read

**Example:**
```bash
curl -X PATCH http://localhost:4000/api/notifications/clh111/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 20.3 Delete Notification

**Endpoint:** `DELETE /api/notifications/:id`  
**Auth Required:** ✅ Yes  
**Description:** Delete a notification

**Example:**
```bash
curl -X DELETE http://localhost:4000/api/notifications/clh111 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 21. Admin Dashboards

### 21.1 Admin Overview

**Endpoint:** `GET /api/admin/projects/overview`  
**Auth Required:** ✅ Yes (ADMIN, CEO, or HOO)  
**Description:** Get system-wide project overview

**Example:**
```bash
curl http://localhost:4000/api/admin/projects/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 21.2 Pending Approvals

**Endpoint:** `GET /api/admin/tasks/pending-approval`  
**Auth Required:** ✅ Yes (ADMIN, CEO, HOO, or HR)  
**Description:** Get all tasks requiring approval

**Example:**
```bash
curl http://localhost:4000/api/admin/tasks/pending-approval \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 22. Role-Specific Endpoints

### 22.1 CEO Analytics

**Endpoint:** `GET /api/ceo/analytics`  
**Auth Required:** ✅ Yes (CEO only)  
**Description:** Executive-level analytics

**Example:**
```bash
curl http://localhost:4000/api/ceo/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 22.2 HR Team Performance

**Endpoint:** `GET /api/hr/team-performance`  
**Auth Required:** ✅ Yes (HR or CEO)  
**Description:** Team performance metrics

**Example:**
```bash
curl http://localhost:4000/api/hr/team-performance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 22.3 Staff My Tasks

**Endpoint:** `GET /api/staff/my-tasks`  
**Auth Required:** ✅ Yes  
**Description:** Get tasks assigned to you

**Example:**
```bash
curl http://localhost:4000/api/staff/my-tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 22.4 Staff My Profile

**Endpoint:** `GET /api/staff/my-profile`  
**Auth Required:** ✅ Yes  
**Description:** Get your profile

**Example:**
```bash
curl http://localhost:4000/api/staff/my-profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 22.5 Update My Profile

**Endpoint:** `PUT /api/staff/my-profile`  
**Auth Required:** ✅ Yes  
**Description:** Update your profile

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

**Example:**
```bash
curl -X PUT http://localhost:4000/api/staff/my-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated Name"
  }'
```

---

## Common Workflows

### Workflow 1: Creating and Working on a Task

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Create a task
TASK_ID=$(curl -X POST http://localhost:4000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix bug in login",
    "projectId": "clh789",
    "type": "BUG",
    "priority": "HIGH"
  }' | jq -r '.id')

# 3. Start timer
curl -X POST http://localhost:4000/api/time/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"taskId\": \"$TASK_ID\"}"

# 4. Update status to IN_PROGRESS
curl -X PUT http://localhost:4000/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}'

# 5. Add comment
curl -X POST http://localhost:4000/api/tasks/$TASK_ID/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Working on this now"}'

# 6. Upload screenshot
curl -X POST http://localhost:4000/api/tasks/$TASK_ID/attachments \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@screenshot.png"

# 7. Stop timer
curl -X POST http://localhost:4000/api/time/stop \
  -H "Authorization: Bearer $TOKEN"

# 8. Mark as done
curl -X PUT http://localhost:4000/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "REVIEW"}'
```

---

### Workflow 2: Sprint Planning

```bash
# 1. Create sprint
SPRINT_ID=$(curl -X POST http://localhost:4000/api/projects/clh789/sprints \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sprint 5",
    "goal": "Complete user profile",
    "startDate": "2025-12-01T00:00:00Z",
    "endDate": "2025-12-14T23:59:59Z"
  }' | jq -r '.id')

# 2. Add tasks to sprint
curl -X POST http://localhost:4000/api/sprints/$SPRINT_ID/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskIds": ["task1", "task2", "task3"]}'

# 3. Start sprint
curl -X POST http://localhost:4000/api/sprints/$SPRINT_ID/start \
  -H "Authorization: Bearer $TOKEN"

# 4. View burndown chart
curl http://localhost:4000/api/sprints/$SPRINT_ID/burndown \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | No token or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `DUPLICATE` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

- **General API:** 100 requests/minute
- **Authentication:** 10 requests/minute per IP
- **File Upload:** 20 requests/minute

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

---

## Testing with Postman

1. Import Swagger JSON: `http://localhost:4000/api-docs/swagger.json`
2. Create environment variable: `token`
3. Set Authorization: Bearer Token → `{{token}}`
4. After login, save token to environment

---

## Support & Resources

- **Live API Docs:** http://localhost:4000/api-docs
- **Swagger UI:** Interactive testing interface
- **Base URL:** http://localhost:4000/api
- **GitHub:** https://github.com/MAR-ABU-PROJECTS/TaskManagement-Workflow

---

**Document Version:** 1.0.0  
**Last Updated:** November 28, 2025  
**Total Endpoints:** 158
