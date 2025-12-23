# Task Management System - Complete User Documentation

**Version:** 2.3.0  
**Last Updated:** December 23, 2025  
**Production URL:** https://taskmanagement-workflow-production.up.railway.app  
**Documentation Type:** Complete System Guide

> 🎉 **Version 2.3.0 Updates:** Simplified project roles! Only PROJECT_ADMIN (creator) and DEVELOPER (members). Roles auto-assigned, no selection needed.
> 🔒 **Breaking Change:** PROJECT_LEAD, DEVELOPER, DEVELOPER roles removed. All members now DEVELOPER.

---

## What's New

### v2.2.0 (December 21, 2025) - Hierarchical Visibility

**Viewing Hierarchy Implemented:**

| Role | Can View |
|------|----------|
| SUPER_ADMIN | ✅ Everything (all projects, all tasks, all personal tasks) - audit |
| CEO | ✅ All projects, all project tasks<br>❌ Cannot see personal tasks |
| HOO/HR | ✅ ADMIN + STAFF projects/tasks only<br>❌ Cannot see CEO's unless added as member/assignee<br>❌ Cannot see personal tasks |
| ADMIN/STAFF | ✅ Only their projects (member/creator)<br>✅ Only their tasks (assigned/creator)<br>❌ Cannot see others' personal tasks |

**Personal Task Privacy:**
- 🔒 Personal tasks (no project) only visible to creator + SUPER_ADMIN
- ❌ CEO/HOO/HR/ADMIN cannot view personal tasks of others

**Rationale:** Clear authority flow, privacy protection, audit transparency.

---

### v2.1.1 (December 21, 2025) - Update Permission Restrictions

**Creator-Only Update Policy:**
- ❌ Only project creators can update project details (PUT `/projects/:id`)
- ❌ Only task creators can update task details (PUT `/tasks/:id`)
- ✅ ADMIN retains all other operational permissions
- ✅ ADMIN can still delete, approve, reject, assign, and manage members

**Rationale:** Protects creator intent and ownership while maintaining ADMIN's ability to manage workflows and operations.

---

### v2.1.0 (December 21, 2025) - ADMIN Role Enhancement

**ADMIN Role - Full Operational Access:**
- ✅ Create, update, and delete projects
- ✅ Add, update, and remove project members  
- ✅ Approve and reject tasks
- ✅ Assign and unassign tasks
- ✅ Change task status and update tasks
- ✅ Delete tasks (in projects they're members of)
- ✅ Same operational capabilities as CEO/HOO/HR

**SUPER_ADMIN Role - Clarified as Audit-Only:**
- 🔍 Read-only access for auditing and oversight
- 🔍 Can view all projects and tasks
- ❌ Cannot perform operational write operations
- ❌ Cannot be assigned to tasks
- ✅ Retains user management capabilities (promote/demote)

**Why These Changes?**
- Clear separation between operational roles and audit roles (SUPER_ADMIN)
- Creator ownership protection for project and task updates
- ADMIN retains full management capabilities for all other operations
- Better alignment with organizational hierarchies

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [User Roles & Hierarchy](#user-roles--hierarchy)
4. [Project Management](#project-management)
5. [Task Management](#task-management)
6. [Sprint & Agile Workflows](#sprint--agile-workflows)
7. [Team Collaboration](#team-collaboration)
8. [Search & Filtering](#search--filtering)
9. [Time Tracking](#time-tracking)
10. [Reports & Analytics](#reports--analytics)
11. [Notifications & Emails](#notifications--emails)
12. [Automation Rules](#automation-rules)
13. [Administration](#administration)
14. [Security & Permissions](#security--permissions)
15. [Troubleshooting](#troubleshooting)
16. [API Integration](#api-integration)

---

## System Overview

### What is This System?

A **Jira-like Task Management System** designed for organizations to manage projects, tasks, teams, and workflows efficiently. Built with modern web technologies and deployed on Railway cloud platform.

### Key Features

#### 🎯 Core Functionality
- **Task Management**: Create, assign, track, and manage tasks with multiple priority levels
- **Workflow System**: Jira-style state machine with validated transitions (BASIC, AGILE, BUG_TRACKING)
- **Project Management**: Organize work into projects with team members and workflow types
- **Sprint Planning**: Agile workflows with sprint management, burndown charts, velocity tracking
- **Kanban Boards**: Status-based visual workflow with drag-and-drop and validation
- **Epic Management**: Group related tasks into large features

#### 👥 Team Collaboration
- **Comments & Mentions**: Discuss tasks and notify team members
- **File Attachments**: Upload documents, images, and files to tasks
- **Activity Tracking**: Complete audit trail of all changes
- **Watchers**: Follow tasks you're interested in
- **Real-time Updates**: See changes as they happen

#### 📊 Reporting & Analytics
- **Velocity Charts**: Track team completion speed
- **Burndown Charts**: Monitor sprint progress
- **Productivity Reports**: Team and individual performance
- **Cycle Time Analysis**: Measure task completion time
- **Project Health Reports**: Overall project status

#### 🔐 Advanced Security
- **Dual RBAC System**: Global roles + Project-level roles
- **32+ Permissions**: Granular access control
- **Role Hierarchy**: 6 levels (SUPER_ADMIN → STAFF)
- **Audit Logging**: Track all system actions
- **Protected Accounts**: Super Admin safeguards

#### 🤖 Automation
- **17 Built-in Rules**: Automate repetitive tasks
- **Auto-assignment**: Automatically assign tasks based on rules
- **Status Transitions**: Auto-update statuses
- **Notifications**: Automated email alerts
- **Deadline Reminders**: Hourly checks for upcoming deadlines

#### 🔍 Advanced Search
- **JQL (Jira Query Language)**: Powerful search syntax
- **Saved Filters**: Save and share custom searches
- **Quick Filters**: Predefined common searches
- **Full-text Search**: Search across all task fields

---

## Getting Started

### System Access

**Production URL:** https://taskmanagement-workflow-production.up.railway.app

**Swagger API Documentation:** https://taskmanagement-workflow-production.up.railway.app/api-docs

### Account Creation

#### Option 1: Self Registration
1. Navigate to `/api/auth/register`
2. Provide:
   - Email address
   - Password (minimum 8 characters)
   - Full name
3. Click "Register"
4. You'll be assigned **STAFF** role by default

#### Option 2: Admin Creation
1. Ask your administrator to create an account
2. You'll receive credentials via email
3. Use provided email and temporary password
4. Change password on first login

### First Login

1. Go to `/api/auth/login`
2. Enter your email and password
3. Receive JWT tokens:
   - **Access Token** (valid 24 hours)
   - **Refresh Token** (valid 7 days)
4. Store tokens securely

### Logout

1. Click your profile icon in the top right
2. Select "Logout" from the dropdown
3. Your session will be terminated and logged to the audit trail
4. Tokens are cleared from your browser
5. You'll be redirected to the login page

**API Endpoint:** `POST /api/auth/logout`

### Your Dashboard

After login, your dashboard shows:

**Left Sidebar:**
- Projects you're part of
- Your teams
- Saved filters
- Quick links

**Main Panel:**
- Tasks assigned to you
- Tasks you created
- Recent activity
- Upcoming deadlines

**Top Bar:**
- Search
- Notifications (🔔)
- Profile menu
- Create task button

---

## User Roles & Hierarchy

### Global Role System

The system has **6 hierarchical roles** with different authority levels:

#### 🔒 SUPER_ADMIN (Level 100)

**Quantity:** Exactly 2 accounts (permanent)

**Purpose:** Audit and oversight, outside operational hierarchy

**Abilities:**
- ✅ Read-only access to all system data (audit/oversight)
- ✅ Promote/demote users to any role including CEO
- ✅ View all users, projects, tasks (cannot modify)
- ✅ Access audit logs and system reports
- ✅ Cannot be removed or modified by anyone
- ✅ Not visible in company operational logs
- ❌ Cannot perform operational write operations
- ❌ Cannot be assigned to tasks
- ❌ Does not participate in day-to-day operations

**Key Distinction:** SUPER_ADMIN is for **audit and user management only**, not operational work.

**Restrictions:**
- Cannot be promoted or demoted
- Cannot be deactivated or deleted
- Must always have exactly 2 accounts

**Use Cases:**
- System setup and maintenance
- Emergency access
- CEO appointments
- Critical system changes

---

#### 👑 CEO (Level 80)

**Quantity:** Unlimited

**Purpose:** Chief Executive Officer - Top company authority

**Abilities:**
- ✅ Promote to HOO, HR, ADMIN, STAFF
- ✅ View all projects and tasks
- ✅ Access all departments
- ✅ Company-wide reports
- ✅ Manage any user (except Super Admin)
- ✅ Create/delete projects
- ✅ Override project permissions

**Restrictions:**
- ❌ Cannot promote to CEO (only Super Admin can)
- ❌ Cannot modify Super Admins
- ❌ Cannot access system configuration

**Promotion Path:**
- Only **Super Admin** can promote to CEO
- Typically one CEO per organization

---

#### 🏢 HOO - Head of Operations (Level 60)

**Quantity:** Unlimited

**Department:** Automatically assigned to **OPS**

**Purpose:** Operations department leadership

**Abilities:**
- ✅ Manage OPS department staff
- ✅ Promote STAFF → ADMIN (OPS only)
- ✅ Create projects
- ✅ View operations reports
- ✅ Assign tasks to OPS team
- ✅ Manage OPS workflows

**Restrictions:**
- ❌ Cannot promote beyond ADMIN
- ❌ Cannot manage HR department
- ❌ Cannot promote to HOO (CEO/Super Admin only)

**Promotion Path:**
- Promoted by CEO or Super Admin
- Department locked to OPS

---

#### 👥 HR - Human Resources (Level 60)

**Quantity:** Unlimited

**Department:** Automatically assigned to **HR**

**Purpose:** HR department management

**Abilities:**
- ✅ Manage HR department staff
- ✅ Promote STAFF → ADMIN (HR only)
- ✅ Create projects
- ✅ View HR reports
- ✅ Assign tasks to HR team
- ✅ Manage HR workflows

**Restrictions:**
- ❌ Cannot promote beyond ADMIN
- ❌ Cannot manage OPS department
- ❌ Cannot promote to HR (CEO/Super Admin only)

**Promotion Path:**
- Promoted by CEO or Super Admin
- Department locked to HR

---

#### 👔 ADMIN (Level 40)

**Quantity:** Unlimited

**Department:** OPS or HR (based on promoter)

**Purpose:** Mid-level management with **full operational access**

**Abilities:**
- ✅ **Create, update, and delete projects**
- ✅ **Add, update, and remove project members**
- ✅ **Approve and reject tasks**
- ✅ **Assign and unassign tasks**
- ✅ **Change task status and update tasks**
- ✅ **Delete tasks** (in projects they're members of)
- ✅ Manage project teams and workflows
- ✅ View department reports
- ✅ Perform bulk operations
- ✅ Full operational permissions (same as CEO/HOO/HR)

**Department Assignment:**
- Promoted by HOO → Gets OPS department
- Promoted by HR → Gets HR department
- Promoted by CEO/Super Admin → Can choose department

**Restrictions:**
- ❌ Cannot promote users (no promotion authority)
- ❌ Cannot modify user roles

**Promotion Path:**
- STAFF promoted by HOO, HR, CEO, or Super Admin
- **Key role:** Full operational capabilities without promotion authority

---

#### 🎯 STAFF (Level 20)

**Quantity:** Unlimited

**Department:** Any

**Purpose:** Base-level team members

**Abilities:**
- ✅ Create tasks
- ✅ Comment on tasks
- ✅ Upload attachments
- ✅ Log time
- ✅ View assigned projects
- ✅ Update own tasks

**Restrictions:**
- ❌ Cannot create projects
- ❌ Cannot promote anyone
- ❌ Cannot delete others' work
- ❌ Limited reporting access

**Default Role:**
- All new registrations start as STAFF
- Can be promoted to ADMIN by managers

---

### Project Roles

Within each project, users have **project-specific roles**:

#### ⚙️ PROJECT_ADMIN (Creator Only)

**Automatically Assigned To:**
- Project creator only

**Abilities:**
- ✅ Full project control and ownership
- ✅ Add/remove team members
- ✅ Manage all permissions
- ✅ Delete any task
- ✅ Archive/delete project
- ✅ Configure workflows
- ✅ Approve and reject tasks
- ✅ Manage sprints and epics
- ✅ Access all project settings
- ✅ Assign tasks to any team member

**Notes:**
- This role cannot be changed or assigned to others
- Only one PROJECT_ADMIN per project (the creator)

---

#### 💻 DEVELOPER (All Members)

**Automatically Assigned To:**
- All users added to the project

**Abilities:**
- ✅ Create tasks
- ✅ Edit own tasks
- ✅ Edit assigned tasks
- ✅ Add comments
- ✅ Upload attachments
- ✅ Log time
- ✅ Move tasks between statuses
- ✅ View project data
- ✅ View sprints and epics
- ✅ Transition tasks through workflow

**Restrictions:**
- ❌ Cannot approve or reject tasks
- ❌ Cannot delete project
- ❌ Cannot manage team members
- ❌ Cannot create or manage sprints/epics

**Notes:**
- This role is automatically assigned and cannot be changed
- All non-creator project members have this role

---

### Promotion & Demotion System

#### How Promotions Work

1. **Authority Check**: System verifies promoter has authority
2. **Department Validation**: Ensures department compatibility
3. **Role Assignment**: Updates user's global role
4. **Department Update**: Auto-assigns department if applicable
5. **Email Notification**: Sends celebratory promotion email
6. **Audit Log**: Records the promotion action

**Promotion Email Includes:**
- Congratulations message
- Old role → New role
- Who promoted you
- New permissions overview
- Next steps

#### How Demotions Work

1. **Authority Check**: Verifies demoter has authority
2. **Task Review**: Checks for critical tasks
3. **Role Update**: Downgrades user role
4. **Email Notification**: Sends professional demotion notice
5. **Audit Log**: Records the action

**Demotion Email Includes:**
- Professional notification
- Old role → New role
- Who made the change
- Optional reason
- Updated permissions
- Support information

#### Promotion Rules Matrix

| Promoter Role | Can Promote To | Department Restriction |
|--------------|----------------|----------------------|
| SUPER_ADMIN | CEO, HOO, HR, ADMIN, STAFF | Any (audit-only role, manages user roles but not operational) |
| CEO | HOO, HR, ADMIN, STAFF | Any |
| HOO | ADMIN (from STAFF only) | OPS only |
| HR | ADMIN (from STAFF only) | HR only |
| ADMIN | None | N/A |
| STAFF | None | N/A |

---

## Project Management

### Creating a Project

**Who Can Create:**
- CEO, HOO, HR, ADMIN

**Note:** SUPER_ADMIN has audit-only access and does not perform operational tasks.

**Steps:**
1. Click "Create Project" button
2. Fill in required fields:
   - **Name**: Project identifier (e.g., "Website Redesign")
   - **Key**: Short code (e.g., "WEB" - will prefix all tasks)
   - **Description**: Project overview
   - **Department**: OPS, HR, or OTHER
   - **Workflow**: Select workflow template
3. Optional settings:
   - Default assignee
   - Components
   - Versions
4. Click "Create"

**After Creation:**
- You become PROJECT_ADMIN automatically
- Add team members
- Configure permissions
- Create initial tasks

### Project Settings

**Access:** Project → Settings (⚙️)

#### General Settings
- Project name and description
- Project key (cannot change after creation)
- Project icon/avatar
- Default workflow
- Time tracking enabled/disabled

#### Team Management
- Add members
- Assign project roles
- Remove members
- Change member permissions

#### Components
Organize tasks by component:
- Frontend
- Backend
- Database
- API
- Documentation

**Example:**
- Task: WEB-123 (Frontend) - Fix login button
- Task: WEB-124 (Backend) - Add authentication endpoint

#### Versions
Track releases:
- v1.0 - Initial Release
- v1.1 - Bug Fixes
- v2.0 - Major Update

**Use Cases:**
- Assign tasks to specific versions
- Track release progress
- Generate version reports

### Project Workflows

**What is a Workflow?**
The sequence of statuses a task can move through.

**Default Workflows:**

**1. Simple Workflow**
```
To Do → In Progress → Done
```
Best for: Small teams, simple projects

**2. Development Workflow**
```
To Do → In Progress → Code Review → Testing → Done
```
Best for: Software development

**3. Approval Workflow**
```
To Do → In Progress → Review → Approved → Done
           ↓
        Rejected → To Do
```
Best for: Tasks requiring approval

**4. Bug Workflow**
```
Reported → Confirmed → In Progress → Fixed → Verified → Closed
```
Best for: Bug tracking projects

**Custom Workflows:**
- Create custom status sequences
- Define transition rules
- Add validators and conditions
- Configure post-functions

### Project Permissions

Each project can have custom permission schemes:

**Permission Levels:**
1. **Public**: Anyone in organization can view
2. **Private**: Only team members can access
3. **Restricted**: Specific roles only

**Configurable Permissions:**
- Who can create tasks
- Who can edit tasks
- Who can delete tasks
- Who can manage sprints
- Who can view reports

---

## Task Management

### Task Types

#### 📌 Task
**Purpose:** General work items

**Use Cases:**
- Implement feature
- Update documentation
- Refactor code
- Design mockup

**Fields:**
- Title, description
- Assignee, reporter
- Priority, due date
- Story points

---

#### 🐛 Bug
**Purpose:** Track defects and issues

**Use Cases:**
- Login button not working
- Page loading slowly
- Data not saving

**Additional Fields:**
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment
- Severity level

---

#### 📖 Story
**Purpose:** User-facing features

**Format:** "As a [user], I want [feature], so that [benefit]"

**Example:**
"As a customer, I want to reset my password, so that I can regain access to my account"

**Fields:**
- Acceptance criteria
- Story points
- Sprint assignment

---

#### 🎯 Epic
**Purpose:** Large features spanning multiple tasks

**Use Cases:**
- User Authentication System
- Payment Integration
- Mobile App Launch

**Contains:**
- Multiple stories/tasks
- Timeline
- Overall goal

---

### Creating Tasks

**Step-by-Step:**

1. **Navigate to Project**
   - Click project from sidebar
   - Or use quick create (C key)

2. **Click "Create Task"**

3. **Fill Required Fields:**
   - **Project**: Select from dropdown
   - **Type**: Task, Bug, Story, Epic
   - **Summary**: Brief title (max 255 chars)

4. **Optional Fields:**
   - **Description**: Detailed explanation (supports markdown)
   - **Assignee**: Who will work on it
   - **Reporter**: Who created it (auto-filled)
   - **Priority**: Low, Medium, High, Critical
   - **Labels**: Tags for categorization
   - **Components**: Which part of project
   - **Fix Version**: Target release
   - **Due Date**: Deadline
   - **Story Points**: Complexity estimate (1, 2, 3, 5, 8, 13)
   - **Original Estimate**: Time estimate (hours)

5. **Advanced Options:**
   - **Parent Task**: Link to parent
   - **Epic**: Associate with epic
   - **Sprint**: Add to sprint
   - **Watchers**: Who should follow
   - **Requires Approval**: Enable approval workflow

6. **Click "Create"**

**Quick Create Shortcuts:**
- Press `C` anywhere to quick create
- Press `Shift + C` to clone current task
- Use templates for recurring task types

### Task Workflow & Status

> 🎯 **Jira-Style Workflow:** Tasks follow workflow state machines. Status transitions are validated based on project's workflow type.

#### Workflow Types

**BASIC Workflow (Linear)**
```
DRAFT → ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED
```
Best for: Simple projects with straightforward processes

**AGILE Workflow (Iterative)**
```
DRAFT → ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED
(with backlog management and iterative feedback)
```
Best for: Agile/Scrum teams with sprints

**BUG_TRACKING Workflow (Testing Focus)**
```
DRAFT (New) → ASSIGNED (Confirmed) → IN_PROGRESS (Fixing) → REVIEW (Testing) → COMPLETED (Closed)
```
Best for: Bug tracking and QA processes

#### Status Meanings

| Status | Description | Who Can Move Here |
|--------|-------------|-----------------|
| **DRAFT** | Initial idea, not yet ready | Task creator |
| **ASSIGNED** | Ready to work, assigned to someone | Project leads |
| **IN_PROGRESS** | Work actively happening | Assignee |
| **PAUSED** | Temporarily blocked/on hold | Assignee |
| **REVIEW** | Submitted for review/testing | Assignee |
| **COMPLETED** | Successfully finished | Project lead (after review) |
| **REJECTED** | Closed without completion | Project lead |

#### Changing Task Status

**Option 1: Transition Button**
1. Open task details
2. Click current status badge
3. See only valid transitions for current state
4. Select new status
5. System validates against workflow rules

**Option 2: Drag on Board**
1. Open Kanban board
2. Drag task to different column
3. Task status updates automatically
4. Workflow validation ensures valid moves

**Option 3: Quick Actions**
- "Start Progress" (ASSIGNED → IN_PROGRESS)
- "Submit for Review" (IN_PROGRESS → REVIEW)
- "Approve & Complete" (REVIEW → COMPLETED)
- "Request Changes" (REVIEW → IN_PROGRESS)

**Note:** Adding a comment when changing status is **optional**. You can transition tasks without providing a comment, though adding context is recommended for team communication.

#### Available Transitions

The system shows only transitions you can perform:
- Based on current status
- Based on project workflow type
- Based on your role permissions

**Example (AGILE workflow, task in IN_PROGRESS):**
- ✅ "Ready for Review" → REVIEW
- ✅ "Pause Sprint" → PAUSED
- ❌ "Complete" → Cannot skip review stage

### Task Details Page

When you open a task, you see:

**Header:**
- Task key (e.g., WEB-123)
- Task type icon
- Summary/title
- Status badge with workflow transitions
- Priority indicator

**Left Panel:**
- Description
- Comments section
- Activity history
- Attachments

**Right Panel:**
- **Details:**
  - Status
  - Assignee
  - Reporter
  - Priority
  - Created date
  - Updated date
  - Due date
  
- **People:**
  - Assignee
  - Reporter
  - Watchers
  
- **Dates:**
  - Created
  - Updated
  - Due date
  - Resolved date
  
- **Time Tracking:**
  - Original estimate
  - Time logged
  - Remaining time
  
- **Categorization:**
  - Labels
  - Components
  - Fix version
  - Sprint
  - Epic

**Actions:**
- Edit
- Assign
- Comment
- Attach
- Log work
- Link
- Clone
- **Delete** (with permission checks)
- Watch/Unwatch

**Delete Permissions:**
- PROJECT_ADMIN/PROJECT_ADMIN can delete any project task
- Task creator can delete their own personal tasks
- Global admins (CEO/HOO/HR/SUPER_ADMIN) can delete any task
- Deletion is permanent and cannot be undone

### Task Statuses

#### 📋 To Do
**Meaning:** Task not started

**Who Can Move Here:**
- Anyone with edit permission

**Typical Actions:**
- Review requirements
- Ask questions
- Clarify scope

---

#### 🔄 In Progress
**Meaning:** Currently being worked on

**Who Can Move Here:**
- Assignee
- Project Lead
- Project Admin

**Typical Actions:**
- Update description
- Log time
- Add comments on progress
- Upload work-in-progress files

---

#### 🔍 In Review
**Meaning:** Work completed, awaiting review

**Who Can Move Here:**
- Assignee (after completing work)

**Typical Actions:**
- Code review
- Test review
- Design review
- Documentation review

---

#### ✅ Done
**Meaning:** Task completed and verified

**Who Can Move Here:**
- Reviewer
- Project Lead
- Project Admin

**Effect:**
- Closes task
- Updates sprint statistics
- Triggers completion notifications

---

#### 🚫 Blocked
**Meaning:** Cannot proceed due to dependency

**Who Can Move Here:**
- Assignee
- Anyone with edit permission

**Required:**
- Add comment explaining blocker
- Link to blocking task/issue

**Typical Reasons:**
- Waiting for another task
- Missing requirements
- External dependency
- Technical limitation

---

#### ⏸️ On Hold
**Meaning:** Paused, not currently active

**Who Can Move Here:**
- Project Lead
- Project Admin

**Typical Reasons:**
- Deprioritized
- Waiting for decision
- Resource constraints

---

### Task Priority Levels

#### 🔴 Critical
**SLA:** Immediate attention required

**Use Cases:**
- Production down
- Data loss
- Security breach
- Major bug affecting all users

**Response Time:** < 1 hour

---

#### 🟠 High
**SLA:** Address within 24 hours

**Use Cases:**
- Important feature request
- Bug affecting multiple users
- Deadline approaching

**Response Time:** < 24 hours

---

#### 🟡 Medium (Default)
**SLA:** Normal priority

**Use Cases:**
- Standard features
- Minor bugs
- Improvements

**Response Time:** Within sprint

---

#### 🟢 Low
**SLA:** When convenient

**Use Cases:**
- Nice-to-have features
- Cosmetic issues
- Documentation updates

**Response Time:** No SLA

---

### Task Dependencies

**Link Types:**

1. **Blocks** / **Is Blocked By**
   - Task A blocks Task B
   - B cannot start until A is done

2. **Relates To**
   - General relationship
   - No blocking

3. **Duplicates** / **Is Duplicated By**
   - Same task created twice
   - Close duplicate

4. **Parent** / **Subtask**
   - Hierarchical relationship
   - Break large tasks into subtasks

**Creating Dependencies:**
1. Open task
2. Click "Link Issue"
3. Select link type
4. Search for target task
5. Add link

**Dependency Visualization:**
- Red indicator if blocked
- Dependency graph view
- Gantt chart timeline

---

## Sprint & Agile Workflows

### What is a Sprint?

A **fixed time period** (typically 1-4 weeks) where team commits to completing specific tasks.

**Sprint Lifecycle:**
```
Planning → Active → Review → Retrospective → Complete
```

### Sprint Planning

**Before Starting:**

1. **Prepare Backlog**
   - Prioritize tasks
   - Estimate story points
   - Clear descriptions

2. **Team Capacity**
   - Calculate available hours
   - Account for holidays
   - Consider team velocity

3. **Set Sprint Goal**
   - What to achieve
   - Why it matters
   - Success criteria

**Creating a Sprint:**

1. **Go to Project → Sprints**
2. **Click "Create Sprint"**
3. **Fill Details:**
   - Name: "Sprint 1", "Q1 Sprint 3", etc.
   - Start Date: When sprint begins
   - End Date: When sprint ends (1-4 weeks later)
   - Goal: What you aim to achieve
4. **Add Tasks:**
   - Drag from backlog
   - Or bulk add
   - Assign story points
5. **Start Sprint**

**Sprint Capacity:**
- System calculates total story points
- Shows team velocity
- Warns if over-capacity

### Active Sprint

**Daily Activities:**

**Stand-ups:**
- What did you do yesterday?
- What will you do today?
- Any blockers?

**Board Updates:**
- Move tasks across columns
- Update progress
- Log time

**Monitoring:**
- Check burndown chart
- Review remaining work
- Identify risks

**Sprint Board Views:**

**1. Kanban View**
```
To Do | In Progress | In Review | Done
─────┼─────────────┼───────────┼──────
WEB-1 | WEB-2      | WEB-5     | WEB-8
WEB-3 | WEB-4      |           | WEB-9
WEB-6 |            |           |
```

**2. List View**
- Tabular format
- Sortable columns
- Quick edit

**3. Swimlane View**
- Grouped by assignee
- Or by priority
- Or by component

### Sprint Reports

#### Burndown Chart
**Shows:** Daily progress toward completion

**Y-Axis:** Remaining story points  
**X-Axis:** Days in sprint  

**Interpretation:**
- **Below ideal line**: Ahead of schedule ✅
- **On ideal line**: On track 👍
- **Above ideal line**: Behind schedule ⚠️

**Example:**
```
Points
  50 |•
     |  ••
  40 |    •••
     |       •••
  30 |          ••• (Ideal)
     |            •••
  20 |               ••
     |                 ••
  10 |                   ••
     |                     •
   0 |_____________________•
     Day 1              Day 14
```

#### Velocity Chart
**Shows:** Story points completed per sprint

**Use:** Predict future capacity

**Example:**
```
Sprint 1: 25 points
Sprint 2: 30 points
Sprint 3: 28 points
Average: 27.7 points/sprint
```

#### Sprint Report
**Includes:**
- Completed tasks
- Incomplete tasks  
- Added mid-sprint
- Removed mid-sprint
- Commitment vs completion

### Sprint Completion

**End of Sprint:**

1. **Sprint Review**
   - Demo completed work
   - Gather feedback
   - Update documentation

2. **Sprint Retrospective**
   - What went well?
   - What needs improvement?
   - Action items for next sprint

3. **Complete Sprint**
   - Click "Complete Sprint"
   - Move incomplete tasks:
     - Back to backlog
     - To next sprint
     - Close if no longer relevant
   - Generate sprint report

4. **Start Next Sprint**
   - Review and adjust capacity
   - Set new goal
   - Repeat cycle

### Backlog Management

**What is a Backlog?**
Prioritized list of tasks not yet scheduled.

**Backlog Refinement:**
- Regularly review and update
- Add new tasks
- Remove irrelevant tasks
- Re-prioritize
- Break down large tasks
- Estimate story points

**Prioritization Techniques:**

**1. MoSCoW Method**
- **Must Have**: Critical
- **Should Have**: Important
- **Could Have**: Nice to have
- **Won't Have**: Not now

**2. Value vs Effort**
```
High Value, Low Effort → Do First
High Value, High Effort → Plan Carefully
Low Value, Low Effort → Fill time
Low Value, High Effort → Avoid
```

**3. RICE Score**
- **Reach**: How many users affected
- **Impact**: How much improvement
- **Confidence**: How certain
- **Effort**: How much work

### Epic Management

**Creating Epics:**

1. **Create Task** → Select type "Epic"
2. **Fill Details:**
   - Epic Name: "User Authentication System"
   - Description: Overall goal
   - Due Date: Target completion
   - Components: Affected areas

3. **Add Tasks to Epic:**
   - Create tasks
   - Link to epic
   - Or drag tasks to epic

**Epic Board:**
- Visual progress of epic
- Shows child tasks
- Completion percentage
- Timeline view

**Epic Reports:**
- Total story points
- Completed vs remaining
- Time spent
- Contributors

---

## Team Collaboration

### Comments & Discussions

**Adding Comments:**

1. Open task
2. Scroll to Comments section
3. Type your message
4. Use formatting:
   - **Bold**: `**text**`
   - *Italic*: `*text*`
   - `Code`: `` `code` ``
   - Links: `[text](url)`
   - Lists: `- item` or `1. item`

5. Click "Comment"

**Mentioning Users:**
- Type `@` followed by name
- Select from dropdown
- User receives notification

**Example:**
```
@john.doe Can you review the authentication logic?
I've updated the code in commit abc123.

@jane.smith FYI, this might affect the frontend.
```

**Comment Actions:**
- Edit own comments
- Delete own comments (PROJECT_ADMIN can delete any)
- React with emoji
- Quote comment
- Create task from comment

### File Attachments

**Uploading Files:**

1. Open task
2. Click "Attach Files"
3. Choose file(s) from computer
4. Add description (optional)
5. Upload

**Supported Types:**
- Documents: PDF, DOC, DOCX, TXT, MD
- Spreadsheets: XLS, XLSX, CSV
- Images: JPG, PNG, GIF, SVG
- Archives: ZIP, RAR, TAR
- Code: JSON, XML, SQL
- Design: PSD, AI, FIGMA

**File Limits:**
- Max size: 10MB per file
- Max files: 50 per task

**Viewing Attachments:**
- Images: Preview inline
- Documents: Download or preview
- Archives: Download only

**Managing Attachments:**
- Download individual files
- Download all as ZIP
- Delete own attachments
- Delete any (PROJECT_ADMIN)

### Activity Tracking

**What is Tracked:**
- Task created
- Task updated
- Status changed
- Assignee changed
- Comments added
- Files attached
- Time logged
- Task moved
- Links created

**Activity Feed:**
- Shows all changes
- Real-time updates
- Filter by type
- Filter by user
- Export activity

**Example Activity:**
```
10:30 AM - John Doe changed status To Do → In Progress
10:45 AM - Jane Smith added comment "LGTM 👍"
11:00 AM - John Doe logged 2 hours
11:15 AM - System moved task to current sprint
```

### Watchers

**What are Watchers?**
Users who follow a task and receive notifications about changes.

**Adding Watchers:**
1. Open task
2. Click "Add Watcher"
3. Search for user
4. Click "Add"

**Auto-Watch:**
- Reporter (creator) auto-watches
- Assignee auto-watches
- Anyone who comments auto-watches

**Stop Watching:**
- Click "Stop Watching" on task

**Notification Settings:**
- Choose which events trigger emails
- Manage in profile settings

---

## Search & Filtering

### Quick Search

**Location:** Top navigation bar

**Search Types:**
1. **Task Key**: Type "WEB-123" → Jump to task
2. **Keywords**: Search titles and descriptions
3. **Assignee**: Type "@username"
4. **Recent**: Shows recent tasks

**Keyboard Shortcut:** Press `/` to focus search

### JQL (Jira Query Language)

**What is JQL?**
Powerful query language to search tasks.

**Basic Syntax:**
```
field operator value
```

**Common Fields:**
- `project`
- `status`
- `assignee`
- `reporter`
- `priority`
- `created`
- `updated`
- `dueDate`
- `labels`

**Operators:**
- `=` (equals)
- `!=` (not equals)
- `>` (greater than)
- `<` (less than)
- `>=` (greater than or equal)
- `<=` (less than or equal)
- `IN` (in list)
- `NOT IN` (not in list)
- `~` (contains)
- `IS EMPTY`
- `IS NOT EMPTY`

**Examples:**

**1. Find your tasks:**
```
assignee = currentUser()
```

**2. High priority bugs:**
```
type = Bug AND priority = High
```

**3. Tasks due this week:**
```
dueDate <= endOfWeek()
```

**4. Unresolved tasks in project:**
```
project = "Website Redesign" AND status != Done
```

**5. Tasks created this month:**
```
created >= startOfMonth()
```

**6. Overdue tasks:**
```
dueDate < now() AND status NOT IN (Done, Closed)
```

**7. Tasks with specific label:**
```
labels = "frontend"
```

**8. Multiple conditions:**
```
project = "Mobile App" 
AND status IN ("In Progress", "In Review") 
AND assignee IN (currentUser(), "john.doe")
ORDER BY priority DESC
```

**Functions:**
- `currentUser()` - Your username
- `now()` - Current time
- `startOfDay()`
- `endOfDay()`
- `startOfWeek()`
- `endOfWeek()`
- `startOfMonth()`
- `endOfMonth()`

**Sorting:**
```
ORDER BY priority DESC, created ASC
```

### Saved Filters

**Creating Filters:**

1. Build JQL query
2. Test results
3. Click "Save Filter"
4. Name it: "My High Priority Tasks"
5. Choose visibility:
   - Private (only you)
   - Team (project members)
   - Public (everyone)

**Accessing Filters:**
- Sidebar → Saved Filters
- Or use quick search

**Sharing Filters:**
- Generate filter link
- Share with team
- Add to dashboard

**Common Saved Filters:**

**Personal:**
- My Open Tasks
- Tasks I'm Watching
- Recently Updated
- Due This Week

**Team:**
- Team Sprint Tasks
- Blocked Tasks
- High Priority Items
- Bugs to Fix

### Advanced Filtering

**Filter Panel:**
Shows on left side of search results

**Quick Filters:**
- Status
- Priority
- Assignee
- Type
- Sprint
- Labels
- Components

**Multi-Select:**
- Hold Ctrl/Cmd to select multiple
- Click "Apply Filters"

**Custom Filter Combinations:**
- Combine multiple filters
- Save as new filter
- Export results

---

## Time Tracking

### Logging Time

**How to Log Time:**

1. Open task
2. Click "Log Work"
3. Enter time:
   - Format: `2h 30m` or `2.5h`
   - Date: When work was done
4. Add description: What you did
5. Save

**Time Formats:**
- Minutes: `30m`, `45m`
- Hours: `2h`, `3.5h`
- Combined: `2h 30m`
- Days: `2d` (equals 16h if 8h workday)

**Work Log Entry:**
```
Date: Dec 8, 2024
Time Spent: 2h 30m
Description: Implemented login functionality
Logged by: John Doe
```

### Time Estimates

**Original Estimate:**
Set when creating task

**Example:**
- Task: Implement user authentication
- Original Estimate: 8h

**Remaining Estimate:**
Auto-calculates: `Original - Logged = Remaining`

**Example:**
- Original: 8h
- Logged: 5h
- Remaining: 3h

**Re-estimating:**
- Update remaining estimate if original was wrong
- System tracks estimate changes

### Time Reports

**Personal Time Report:**
- Hours logged per day/week/month
- Breakdown by project
- Breakdown by task type

**Team Time Report:**
- Who logged how much
- Project time allocation
- Billable vs non-billable

**Project Time Report:**
- Total time spent
- Time per component
- Time per sprint
- Estimate accuracy

**Export Options:**
- CSV
- Excel
- PDF

---

## Reports & Analytics

### Project Reports

#### Project Health Report

**Metrics:**
- Total tasks
- Completed tasks
- Overdue tasks
- At-risk tasks
- Blocked tasks
- Average completion time

**Health Score:**
- 🟢 Green (>80%): Healthy
- 🟡 Yellow (50-80%): At Risk
- 🔴 Red (<50%): Critical

**Includes:**
- Task distribution chart
- Priority breakdown
- Status timeline
- Trend analysis

---

#### Velocity Report

**Shows:**
- Story points completed per sprint
- Average velocity
- Velocity trend

**Use Cases:**
- Capacity planning
- Sprint forecasting
- Team performance

**Chart:**
```
Points
  50 |    █
     |  █ █
  40 |█ █ █   █
     |█ █ █   █
  30 |█ █ █ █ █
     |█ █ █ █ █
  20 |█ █ █ █ █
     |─────────────
      S1 S2 S3 S4 S5
      
Avg: 35 points/sprint
```

---

#### Burndown Report

**Sprint Burndown:**
- Daily remaining work
- Ideal vs actual progress
- Completion forecast

**Release Burndown:**
- Weekly remaining work
- Version progress
- Release forecast

---

#### Productivity Report

**Team Productivity:**
- Tasks completed per person
- Average completion time
- Time logged vs estimated
- Quality metrics

**Individual Productivity:**
- Your completed tasks
- Your logged time
- Your velocity
- Your task types

---

#### Cycle Time Report

**Measures:**
- Time from creation to completion
- Time in each status
- Bottleneck identification

**Example:**
```
Average Cycle Time: 5.2 days

Breakdown:
To Do: 1.5 days
In Progress: 2.5 days
In Review: 1.0 days
Done: 0.2 days
```

**Use:** Identify where tasks get stuck

---

### Dashboard Widgets

**Available Widgets:**
- My Assigned Tasks
- Recent Activity
- Sprint Progress
- Project Health
- Upcoming Deadlines
- Time Logged This Week
- Priority Distribution
- Team Workload

**Customizing Dashboard:**
1. Click "Edit Dashboard"
2. Add/remove widgets
3. Resize widgets
4. Rearrange layout
5. Save changes

---

## Notifications & Emails

### Email Notifications

**You receive emails for:**

#### Task-Related
- ✉️ Task assigned to you
- ✉️ Task status changed
- ✉️ Comment on your task
- ✉️ Mention in comment (`@you`)
- ✉️ Task moved to your sprint
- ✉️ Task blocked
- ✉️ Task approaching due date

#### Sprint-Related
- ✉️ Sprint started
- ✉️ Sprint completed
- ✉️ Task added to your sprint
- ✉️ Sprint at risk

#### Role-Related
- ✉️ **Promotion** (Celebratory email)
- ✉️ **Demotion** (Professional notification)
- ✉️ Department changed
- ✉️ Account activated/deactivated

#### Project-Related
- ✉️ Added to project
- ✉️ Removed from project
- ✉️ Project role changed
- ✉️ Project archived

### Email Templates

#### Promotion Email
**Subject:** 🎉 Congratulations on Your Promotion!

**Contains:**
- Celebratory message
- Old role → New role
- Promoted by whom
- New responsibilities
- Next steps

**Design:** Green theme, professional

---

#### Demotion Email
**Subject:** Role Update Notification

**Contains:**
- Professional notification
- Old role → New role
- Changed by whom
- Optional reason
- Updated permissions
- HR contact info

**Design:** Blue theme, supportive

---

#### Task Assignment Email
**Subject:** New Task Assigned: [TASK-123] Task Title

**Contains:**
- Task details
- Assigned by whom
- Priority and due date
- Direct link to task
- Quick actions

---

#### Welcome Email
**Subject:** Welcome to Task Management System!

**Contains:**
- Getting started guide
- Login instructions
- Role explanation
- Support contacts
- Documentation links

---

### Notification Settings

**Managing Notifications:**

1. Go to Profile → Settings
2. Click "Notifications"
3. Choose preferences:
   - Email notifications
   - In-app notifications
   - Desktop notifications

**Granular Control:**
- Enable/disable per event type
- Set frequency (immediate, daily digest, weekly)
- Choose notification channels

**Quiet Hours:**
- Set hours when you don't want notifications
- Weekend settings
- Vacation mode

---

## Automation Rules

### Built-in Automation (17 Rules)

#### 1. Auto-Assign to Reporter
**Trigger:** Task created  
**Action:** Assign to creator

**Use:** Tasks you create are yours

---

#### 2. Auto-Label High Priority
**Trigger:** Priority set to High/Critical  
**Action:** Add "urgent" label

**Use:** Quick filtering

---

#### 3. Move to In Progress
**Trigger:** Time logged on To Do task  
**Action:** Move to In Progress

**Use:** Auto-update status

---

#### 4. Notify on Status Change
**Trigger:** Status changed  
**Action:** Email watchers

**Use:** Keep team informed

---

#### 5. Auto-Close Stale Tasks
**Trigger:** No activity for 90 days  
**Action:** Move to Done with comment

**Use:** Cleanup

---

#### 6. Deadline Reminder
**Trigger:** Due date within 24 hours  
**Action:** Email assignee

**Use:** Prevent missed deadlines

**Runs:** Hourly

---

#### 7. Overdue Auto-Labeler
**Trigger:** Past due date  
**Action:** Add "overdue" label

**Use:** Identify late tasks

**Runs:** Hourly

---

#### 8. Sprint Auto-Start
**Trigger:** Sprint start date reached  
**Action:** Activate sprint

**Use:** Automated sprint management

---

#### 9. Comment on Block
**Trigger:** Status changed to Blocked  
**Action:** Require comment

**Use:** Track blockers

---

#### 10. Assignee Notification
**Trigger:** Task assigned  
**Action:** Email assignee

**Use:** Immediate notification

---

#### 11. Mention Notification
**Trigger:** User mentioned in comment  
**Action:** Email mentioned user

**Use:** Direct communication

---

#### 12. Approval Request
**Trigger:** Requires approval checked  
**Action:** Email approvers

**Use:** Approval workflow

---

#### 13. Sprint Complete Cleanup
**Trigger:** Sprint completed  
**Action:** Move incomplete tasks to backlog

**Use:** Clean up

---

#### 14. Epic Progress Update
**Trigger:** Epic child task completed  
**Action:** Update epic progress

**Use:** Track epic completion

---

#### 15. Time Tracking Reminder
**Trigger:** Task moved to Done  
**Action:** Remind to log time if none logged

**Use:** Ensure time tracking

---

#### 16. Duplicate Detection
**Trigger:** Task created with similar title  
**Action:** Suggest potential duplicates

**Use:** Prevent duplicates

---

#### 17. Component Auto-Assign
**Trigger:** Task created with component  
**Action:** Assign to component owner

**Use:** Automatic routing

---

### Custom Automation

**Creating Custom Rules:**

1. Go to Project Settings → Automation
2. Click "Create Rule"
3. Define trigger:
   - When task created
   - When status changed
   - When field updated
   - Scheduled
4. Add conditions (optional):
   - If priority = High
   - If assignee is empty
   - If labels contain X
5. Define actions:
   - Send email
   - Update field
   - Create subtask
   - Add comment
   - Transition status
6. Test rule
7. Enable

**Example Custom Rule:**

**Name:** Auto-escalate critical bugs  
**Trigger:** Task created  
**Conditions:**  
- Type = Bug  
- Priority = Critical

**Actions:**  
1. Assign to tech lead  
2. Add "urgent" label  
3. Move to In Progress  
4. Email team  

---

## Administration

### User Management

**Who Can Manage:**
- Super Admin: All users
- CEO: All except Super Admin
- HOO: OPS department users
- HR: HR department users

#### Adding Users

**Method 1: Self Registration**
- Users register at `/api/auth/register`
- Start as STAFF role
- Admin activates account

**Method 2: Admin Creation**
1. Go to Users → Add User
2. Fill details:
   - Email
   - Name
   - Role (based on your authority)
   - Department
3. System generates temporary password
4. Email sent to user
5. User changes password on first login

#### Editing Users

**Editable Fields:**
- Name
- Department (if allowed)
- Active status
- Profile information

**Non-Editable:**
- Email (unique identifier)
- Role (use promote/demote)
- Super Admin status

#### Deactivating Users

**Process:**
1. Select user
2. Click "Deactivate"
3. Confirm action
4. User cannot log in
5. Tasks remain assigned

**Reactivating:**
- Click "Activate"
- User can log in again

**Note:** Cannot deactivate Super Admins

#### Removing Users

**Requirements:**
- Must reassign all tasks
- Cannot remove if tasks assigned
- Audit log preserved

**Process:**
1. Select user
2. System checks for assigned tasks
3. If tasks exist:
   - Choose reassignment target
   - Confirm transfer
4. User removed from system
5. Historical data preserved

**Protected:**
- Cannot remove Super Admins
- Cannot remove yourself

### Department Management

**Departments:**
- **OPS** (Operations)
- **HR** (Human Resources)
- **IT** (Information Technology)
- **SALES** (Sales)
- **MARKETING** (Marketing)
- **FINANCE** (Finance)
- **OTHER** (Uncategorized)

**Department Heads:**
- HOO manages OPS
- HR manages HR
- CEO/Super Admin manages all

**Department Assignment:**
- Automatic for HOO/HR
- Manual for others
- Can be changed by authorized users

### System Configuration

**Access:** Super Admin only

**Settings:**

#### General
- System name
- Company logo
- Default timezone
- Date format
- Language

#### Security
- Password policies
- Session timeout
- 2FA settings
- API rate limits

#### Email
- SMTP/Resend configuration
- Email templates
- Notification defaults

#### Workflows
- Default workflows
- Custom workflow templates
- Status configurations

#### Permissions
- Default permission schemes
- Custom permission levels
- Role templates

---

## Security & Permissions

### Permission System

**32 Granular Permissions:**

#### Project Permissions
1. `ADMINISTER_PROJECT` - Full project control
2. `EDIT_PROJECT` - Modify settings

#### Issue Permissions
3. `CREATE_ISSUES` - Create tasks
4. `EDIT_ISSUES` - Edit any task
5. `EDIT_OWN_ISSUES` - Edit own tasks
6. `DELETE_ISSUES` - Delete any task
7. `DELETE_OWN_ISSUES` - Delete own tasks
8. `ASSIGN_ISSUES` - Assign tasks
9. `ASSIGNABLE_USER` - Can be assigned
10. `MOVE_ISSUES` - Move between projects

#### Comment Permissions
11. `ADD_COMMENTS` - Comment on tasks
12. `EDIT_ALL_COMMENTS` - Edit any comment
13. `EDIT_OWN_COMMENTS` - Edit own comments
14. `DELETE_ALL_COMMENTS` - Delete any comment
15. `DELETE_OWN_COMMENTS` - Delete own comments

#### Attachment Permissions
16. `CREATE_ATTACHMENTS` - Upload files
17. `DELETE_ALL_ATTACHMENTS` - Delete any file
18. `DELETE_OWN_ATTACHMENTS` - Delete own files

#### Time Tracking Permissions
19. `WORK_ON_ISSUES` - Log time
20. `EDIT_OWN_WORKLOGS` - Edit own time logs
21. `EDIT_ALL_WORKLOGS` - Edit any time log
22. `DELETE_OWN_WORKLOGS` - Delete own time logs
23. `DELETE_ALL_WORKLOGS` - Delete any time log

#### Sprint Permissions
24. `MANAGE_SPRINTS` - Create/edit sprints
25. `VIEW_SPRINTS` - View sprint details
26. `START_STOP_SPRINTS` - Start/complete sprints

#### Epic Permissions
27. `MANAGE_EPICS` - Create/edit epics
28. `VIEW_EPICS` - View epic details

#### User Management Permissions
29. `VIEW_ALL_USERS` - See all users
30. `MANAGE_USERS` - Add/remove users
31. `PROMOTE_USERS` - Change roles
32. `VIEW_USER_HIERARCHY` - See org chart

### Permission Schemes

**Default Schemes:**

#### Public Scheme
- Anyone can view
- Team members can edit
- Admins can delete

#### Private Scheme
- Only team members can view
- Restricted edit permissions
- Admin-only delete

#### Restricted Scheme
- Project Admin only
- No public access
- Invitation required

**Custom Schemes:**
- Create project-specific permissions
- Assign to project
- Override defaults

### Audit Logging

**What is Logged:**
- User logins/logouts
- Task creation/deletion
- Role changes (promotions/demotions)
- Project modifications
- Permission changes
- Data exports
- Configuration changes

**Log Format:**
```
[2024-12-08 10:30:15] 
User: john.doe
Action: TASK_CREATED
Entity: WEB-123
Details: Created task "Fix login button"
IP: 192.168.1.100
```

**Viewing Logs:**
- Admin Dashboard → Audit Logs
- Filter by:
  - User
  - Action type
  - Date range
  - Entity
- Export as CSV

**Retention:**
- Logs kept indefinitely
- Super Admin can purge old logs
- GDPR compliance options

**Note:** Super Admin actions not logged (outside organization)

---

## Troubleshooting

### Common Issues

#### Cannot Login

**Symptom:** Login fails with "Invalid credentials"

**Solutions:**
1. Verify email is correct
2. Check Caps Lock
3. Reset password
4. Contact admin if account deactivated
5. Check if Super Admin login

---

#### Task Not Showing

**Symptom:** Created task doesn't appear

**Solutions:**
1. Check project filters
2. Verify status filters
3. Check permission to view
4. Refresh page
5. Check if moved to different project

---

#### Cannot Assign Task

**Symptom:** Assignee dropdown empty or user missing

**Solutions:**
1. Verify user is project member
2. Check user has `ASSIGNABLE_USER` permission
3. Verify user is active
4. Contact project admin

---

#### Email Notifications Not Received

**Symptom:** Not getting emails

**Solutions:**
1. Check spam folder
2. Verify email in profile
3. Check notification settings
4. Verify Resend configuration
5. Contact admin

---

#### Sprint Won't Start

**Symptom:** Cannot activate sprint

**Solutions:**
1. Verify start date is today or past
2. Check `MANAGE_SPRINTS` permission
3. Ensure sprint has tasks
4. Check no other active sprint
5. Verify project admin

---

#### Upload Fails

**Symptom:** Cannot attach files

**Solutions:**
1. Check file size (max 10MB)
2. Verify file type supported
3. Check `CREATE_ATTACHMENTS` permission
4. Try different file
5. Check internet connection

---

### Error Codes

**Authentication Errors:**
- `401`: Not authenticated - Login required
- `403`: Forbidden - Insufficient permissions
- `419`: Token expired - Refresh token

**Validation Errors:**
- `400`: Bad request - Check input data
- `422`: Validation failed - Fix errors in form

**Resource Errors:**
- `404`: Not found - Resource doesn't exist
- `409`: Conflict - Duplicate or constraint violation

**Server Errors:**
- `500`: Internal error - Contact admin
- `503`: Service unavailable - Try again later

### Getting Support

**Support Levels:**

**Level 1: Self-Help**
- Check this documentation
- Search FAQ
- Review error messages

**Level 2: Team Support**
- Ask project lead
- Contact department admin
- Use in-app help

**Level 3: Admin Support**
- Contact HOO/HR
- Email CEO
- System admin ticket

**Level 4: Technical Support**
- Contact Super Admin
- Email: support@marprojects.com
- Emergency: Call system admin

---

## API Integration

### Getting Started with API

**Base URL:**
```
https://taskmanagement-workflow-production.up.railway.app/api
```

**Swagger Documentation:**
```
https://taskmanagement-workflow-production.up.railway.app/api-docs
```

### Authentication

**1. Login to Get Tokens:**

```bash
curl -X POST https://taskmanagement-workflow-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STAFF"
  }
}
```

**2. Use Token in Requests:**

```bash
curl -X GET https://taskmanagement-workflow-production.up.railway.app/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### API Endpoints Overview

**Authentication (`/api/auth`):**
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login
- GET `/auth/me` - Get current user
- POST `/auth/refresh` - Refresh token
- POST `/auth/logout` - Logout

**Users (`/api/users`):**
- GET `/users` - List users
- GET `/users/:id` - Get user details
- PATCH `/users/:id` - Update user
- DELETE `/users/:id` - Remove user
- POST `/users/:id/promote` - Promote user
- POST `/users/:id/demote` - Demote user
- GET `/users/dashboard` - User dashboard

**Projects (`/api/projects`):**
- GET `/projects` - List projects
- POST `/projects` - Create project
- GET `/projects/:id` - Get project
- PATCH `/projects/:id` - Update project **(creator only)**
- DELETE `/projects/:id` - Archive project
- GET `/projects/:id/members` - Get team
- POST `/projects/:id/members` - Add member
- DELETE `/projects/:id/members/:userId` - Remove member

**Tasks (`/api/tasks`):**
- GET `/tasks` - List tasks
- POST `/tasks` - Create task
- GET `/tasks/:id` - Get task
- PATCH `/tasks/:id` - Update task **(creator only)**
- DELETE `/tasks/:id` - Delete task
- POST `/tasks/:id/comments` - Add comment
- GET `/tasks/:id/comments` - Get comments
- POST `/tasks/:id/attachments` - Upload file
- POST `/tasks/:id/time-entries` - Log time

**Search (`/api/search`):**
- POST `/search/jql` - JQL search
- GET `/search/filters` - Get saved filters
- POST `/search/filters` - Save filter

**Reports (`/api/projects/:id/reports`):**
- GET `/reports/velocity` - Velocity chart
- GET `/reports/burndown` - Burndown chart
- GET `/reports/health` - Project health
- GET `/reports/productivity` - Team productivity

### Rate Limiting

**Limits:**
- 100 requests per minute per user
- 1000 requests per hour per user

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

**Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### Webhooks

**Coming Soon:**
- Task created
- Task updated
- Task deleted
- Comment added
- Sprint started
- Sprint completed

---

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `C` | Create task |
| `Shift + C` | Clone task |
| `/` | Quick search |
| `E` | Edit current task |
| `A` | Assign current task |
| `M` | Add comment |
| `T` | Start timer |
| `?` | Show all shortcuts |
| `Esc` | Close modal |
| `Ctrl/Cmd + Enter` | Submit form |

### Glossary

**Agile** - Iterative project management methodology  
**API** - Application Programming Interface  
**Assignee** - User responsible for task  
**Backlog** - Prioritized list of pending tasks  
**Blocker** - Issue preventing task completion  
**Burndown** - Chart showing remaining work  
**Component** - Project module or area  
**Cycle Time** - Time from start to completion  
**Epic** - Large feature spanning multiple tasks  
**JQL** - Jira Query Language for searching  
**Kanban** - Visual workflow board  
**RBAC** - Role-Based Access Control  
**Reporter** - User who created task  
**Sprint** - Fixed time period for work  
**Story Points** - Measure of task complexity  
**Velocity** - Speed of task completion  
**Watcher** - User following a task  
**Workflow** - Sequence of task statuses  

### System Specifications

**Technology Stack:**
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Authentication**: JWT (24h access, 7d refresh)
- **Email**: Resend API
- **Hosting**: Railway Cloud Platform
- **API Documentation**: Swagger/OpenAPI

**Performance:**
- Response time: <200ms (95th percentile)
- Uptime: 99.9% SLA
- Max concurrent users: 1000
- Database: Auto-scaling
- CDN: Global edge network

**Security:**
- HTTPS only
- JWT tokens
- CORS enabled
- Rate limiting
- SQL injection protection
- XSS protection
- CSRF protection

**Compliance:**
- GDPR ready
- SOC 2 compliant (hosting)
- Data encryption at rest
- Data encryption in transit
- Audit logging

---

**Document Version:** 2.0.0  
**Last Updated:** December 8, 2025  
**Maintained By:** MAR Projects Team  
**Contact:** support@marprojects.com  
**Production URL:** https://taskmanagement-workflow-production.up.railway.app

---

*End of User Documentation*

### 🎯 Staff (Default Role)

**What you can do:**
- Create and view tasks
- Comment on tasks
- Upload files to tasks
- Track your time
- View projects you're assigned to

**What you cannot do:**
- Create projects
- Manage teams
- Promote or demote users
- Delete other people's work

---

### 👔 Admin (Mid-Level Manager)

**Everything Staff can do, PLUS:**
- Create and manage projects
- Assign tasks to team members
- Manage sprints and planning
- View team reports
- Approve tasks that require approval

**Limitations:**
- Can only manage your department (OPS or HR)
- Cannot promote users beyond ADMIN role

---

### 🏢 HOO (Head of Operations)

**Everything Admin can do, PLUS:**
- Manage all operations department staff
- Promote STAFF to ADMIN in OPS department
- View operations reports across all projects
- Manage operations workflows

**Your Department:** Automatically assigned to OPS

---

### 👥 HR (Human Resources)

**Everything Admin can do, PLUS:**
- Manage all HR department staff
- Promote STAFF to ADMIN in HR department
- View HR reports and analytics
- Manage HR workflows

**Your Department:** Automatically assigned to HR

---

### 👑 CEO (Chief Executive Officer)

**Highest role in the organization:**
- Full access to all projects and teams
- Can promote users to any role (except Super Admin)
- View all reports and analytics
- Manage company-wide workflows
- Cannot be demoted (except by Super Admin)

**Special Privileges:**
- Can promote users to HOO or HR
- Access to all departments
- Company-wide oversight

---

### 🔒 Super Admin (System Administrator)

**Outside the organization:**
- 2 permanent accounts only
- Cannot be removed or modified
- Complete system control
- Only role that can promote to CEO
- Doesn't appear in company logs

**Note:** Super Admins are system administrators, not part of your company structure.

---

## Managing Tasks

### Creating a Task

1. **Go to Your Project**
2. **Click "Create Task"**
3. **Fill in the details:**
   - **Title**: Short description (e.g., "Fix login button")
   - **Description**: Detailed explanation
   - **Type**: Bug, Story, Task, or Epic
   - **Priority**: Low, Medium, High, Critical
   - **Assignee**: Who should work on it
   - **Due Date**: When it should be done

4. **Click "Create"**

### Task Types

- **📌 Task**: Regular work item
- **🐛 Bug**: Something that's broken
- **📖 Story**: User feature or requirement
- **🎯 Epic**: Large feature spanning multiple tasks

### Task Status

Tasks move through these stages:

1. **📋 To Do**: Not started yet
2. **🔄 In Progress**: Currently being worked on
3. **✅ Done**: Completed
4. **🚫 Blocked**: Stuck, waiting for something
5. **🔍 In Review**: Being reviewed by team
6. **✔️ Approved**: Reviewed and approved

### Priority Levels

- **🔴 Critical**: Drop everything, urgent
- **🟠 High**: Important, do soon
- **🟡 Medium**: Normal priority
- **🟢 Low**: Can wait if needed

---

## Working with Projects

### What is a Project?

A project is a collection of related tasks. For example:
- "Website Redesign"
- "Mobile App Development"
- "Q1 Marketing Campaign"

### Project Roles

When you join a project, you get a project-specific role:

**🎨 Viewer**
- View tasks and comments
- See project progress
- Cannot create or edit tasks

**📝 Reporter**
- Everything Viewer can do
- Create new tasks
- Add comments

**💻 Developer**
- Everything Reporter can do
- Edit tasks assigned to you
- Log time on tasks
- Upload files

**👨‍💼 Project Lead**
- Everything Developer can do
- Manage sprints
- Assign tasks to anyone
- Create epics

**⚙️ Project Admin**
- Full control over the project
- Manage team members
- Delete tasks
- Project settings

---

## Team Collaboration

### Commenting on Tasks

1. Open any task
2. Scroll to the "Comments" section
3. Type your message
4. Click "Add Comment"

**💡 Tip:** Use `@username` to mention someone and they'll get a notification!

### Attaching Files

1. Open a task
2. Click "Add Attachment"
3. Choose your file (images, documents, etc.)
4. Add a description (optional)
5. Upload

**Supported Files:** PDF, Word, Excel, Images, ZIP, etc.

### Time Tracking

Track how much time you spend on tasks:

1. Open a task
2. Click "Log Time"
3. Enter hours worked
4. Add a note about what you did
5. Save

**Why track time?**
- Helps estimate future tasks
- Shows your productivity
- Required for billing (if applicable)

---

## Reports & Analytics

### For Team Members (STAFF/ADMIN)

**Your Personal Dashboard:**
- Tasks assigned to you
- Tasks you created
- Time logged this week
- Upcoming deadlines

### For Managers (HOO/HR/CEO)

**Team Reports:**
- **Velocity Chart**: How fast the team completes work
- **Burndown Chart**: Sprint progress tracking
- **Team Productivity**: Who's doing what
- **Cycle Time**: How long tasks take
- **Health Report**: Project status overview

### Understanding Sprint Reports

**🏃 Sprint**: A 1-4 week work period

- **Burndown Chart**: Shows if you're on track to finish
- **Velocity**: How many story points completed
- **Completion Rate**: Percentage of tasks done

**Good to know:**
- Green = On track
- Yellow = At risk
- Red = Behind schedule

---

## Notifications

You'll receive email notifications for:

- ✉️ Tasks assigned to you
- 💬 Mentions in comments
- 🔔 Status changes on your tasks
- 📌 Sprint started/completed
- ⬆️ **Promotions** (congratulations email)
- ⬇️ **Demotions** (professional notification)

**Managing Notifications:**
Go to your profile settings to control which emails you receive.

---

## Advanced Features

### JQL Search (Jira Query Language)

Search for tasks using simple commands:

**Examples:**
```
assignee = currentUser()          # Your tasks
status = "In Progress"            # All in-progress tasks
priority = High                   # High priority tasks
project = "Website Redesign"      # Tasks in specific project
dueDate < endOfWeek()            # Due this week
```

### Saved Filters

Save your frequent searches:
1. Create a search query
2. Click "Save Filter"
3. Name it (e.g., "My High Priority Tasks")
4. Access anytime from sidebar

### Bulk Operations

Update multiple tasks at once:
1. Select tasks (checkbox)
2. Choose action (assign, change status, etc.)
3. Apply to all selected

**⚠️ Careful:** Only admins and above can do bulk operations!

---

## Frequently Asked Questions

### Can I change my role?

No, only your manager can promote or demote you. Role changes depend on:
- Your manager's authority
- Your department
- Your performance

### Who can see my tasks?

- **Your Tasks**: Everyone in the project
- **Private Projects**: Only project members
- **Public Projects**: Anyone in the company

### How do I request access to a project?

Contact the project admin or your manager to be added to a project.

### What happens when I'm promoted?

You'll receive an email notification with:
- Your new role
- Who promoted you
- New permissions you have

### Can I delete a task?

- **Your own tasks**: Yes (if you're the creator)
- **Other's tasks**: Only if you're Project Admin or higher
- **Approved tasks**: Cannot be deleted

### How long are tasks kept?

Tasks are never deleted automatically. Only authorized users can archive/delete tasks.

### What if I forget my password?

Contact your system administrator (Super Admin) to reset your password.

### Can I work on multiple projects?

Yes! You can be a member of unlimited projects, each with different roles.

---

## Getting Help

### Support Levels

1. **Team Members**: Ask your project lead
2. **Project Leads**: Ask department admin (HOO/HR)
3. **Admins**: Contact CEO
4. **CEO**: Contact Super Admin
5. **Technical Issues**: Contact Super Admin

### Tips for Success

✅ **Update task status regularly** - Keeps everyone informed  
✅ **Log your time** - Helps with planning  
✅ **Comment on blockers** - Let others know if you're stuck  
✅ **Set realistic due dates** - Better to under-promise  
✅ **Review daily** - Check your dashboard every morning  

---

## Quick Reference Card

### Task Actions

| Action | How To |
|--------|--------|
| Create Task | Project → Create Task button |
| Edit Task | Open task → Edit button |
| Comment | Open task → Add Comment |
| Attach File | Open task → Add Attachment |
| Log Time | Open task → Log Time |
| Change Status | Open task → Status dropdown |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `C` | Create new task |
| `E` | Edit current task |
| `/` | Quick search |
| `?` | Show all shortcuts |

---

## Glossary

**Sprint**: A fixed time period (1-4 weeks) for completing tasks  
**Epic**: A large feature broken into smaller tasks  
**Story Points**: Measure of task complexity  
**Backlog**: List of tasks not yet scheduled  
**Kanban Board**: Visual board showing task status  
**Burndown**: Chart showing sprint progress  
**Velocity**: Speed of task completion  
**Blocker**: Something preventing task completion  

---

## Need More Help?

📧 **Email**: support@marprojects.com  
📖 **Documentation**: https://taskmanagement-workflow-production.up.railway.app/api-docs  
💬 **In-App Help**: Click "?" icon in top right  

---

**Last Updated:** December 8, 2025  
**System Version:** 2.0.0  
**Maintained by:** MAR Projects Team
