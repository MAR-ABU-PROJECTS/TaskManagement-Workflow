// User Roles
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  CEO = "CEO",
  HOO = "HOO",
  HR = "HR",
  ADMIN = "ADMIN",
  STAFF = "STAFF",
}

// Task Status
export enum TaskStatus {
  DRAFT = "DRAFT",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  PAUSED = "PAUSED",
  REVIEW = "REVIEW",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

// Task Priority
export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

// Issue Type
export enum IssueType {
  TASK = "TASK",
  BUG = "BUG",
  STORY = "STORY",
}

// Activity Actions
export enum ActivityAction {
  CREATE = "CREATE",
  ASSIGN = "ASSIGN",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  STATUS_UPDATE = "STATUS_UPDATE",
  COMMENT = "COMMENT",
}

// Notification Types
export enum NotificationType {
  TASK_ASSIGNED = "TASK_ASSIGNED",
  STATUS_CHANGED = "STATUS_CHANGED",
  COMMENT = "COMMENT",
  MENTION = "MENTION",
  APPROVAL_REQUIRED = "APPROVAL_REQUIRED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// ============================================================================
// JIRA-LIKE ENUMS - Project Roles & Permissions
// ============================================================================

// Project-Level Roles (Jira-style)
export enum ProjectRole {
  PROJECT_ADMIN = "PROJECT_ADMIN", // Full project control
  PROJECT_LEAD = "PROJECT_LEAD", // Manage sprints, epics, approve tasks
  DEVELOPER = "DEVELOPER", // Create, edit assigned tasks
  REPORTER = "REPORTER", // Create issues, add comments
  VIEWER = "VIEWER", // Read-only access
}

// Granular Permissions (Jira-style)
export enum Permission {
  // Project Permissions
  ADMINISTER_PROJECT = "ADMINISTER_PROJECT",
  BROWSE_PROJECT = "BROWSE_PROJECT",
  EDIT_PROJECT = "EDIT_PROJECT",

  // Issue Permissions
  CREATE_ISSUES = "CREATE_ISSUES",
  EDIT_ISSUES = "EDIT_ISSUES",
  EDIT_OWN_ISSUES = "EDIT_OWN_ISSUES",
  DELETE_ISSUES = "DELETE_ISSUES",
  DELETE_OWN_ISSUES = "DELETE_OWN_ISSUES",
  ASSIGN_ISSUES = "ASSIGN_ISSUES",
  ASSIGNABLE_USER = "ASSIGNABLE_USER",
  CLOSE_ISSUES = "CLOSE_ISSUES",
  TRANSITION_ISSUES = "TRANSITION_ISSUES",
  MOVE_ISSUES = "MOVE_ISSUES",

  // Comment Permissions
  ADD_COMMENTS = "ADD_COMMENTS",
  EDIT_ALL_COMMENTS = "EDIT_ALL_COMMENTS",
  EDIT_OWN_COMMENTS = "EDIT_OWN_COMMENTS",
  DELETE_ALL_COMMENTS = "DELETE_ALL_COMMENTS",
  DELETE_OWN_COMMENTS = "DELETE_OWN_COMMENTS",

  // Attachment Permissions
  CREATE_ATTACHMENTS = "CREATE_ATTACHMENTS",
  DELETE_ALL_ATTACHMENTS = "DELETE_ALL_ATTACHMENTS",
  DELETE_OWN_ATTACHMENTS = "DELETE_OWN_ATTACHMENTS",

  // Time Tracking Permissions
  WORK_ON_ISSUES = "WORK_ON_ISSUES",
  EDIT_OWN_WORKLOGS = "EDIT_OWN_WORKLOGS",
  EDIT_ALL_WORKLOGS = "EDIT_ALL_WORKLOGS",
  DELETE_OWN_WORKLOGS = "DELETE_OWN_WORKLOGS",
  DELETE_ALL_WORKLOGS = "DELETE_ALL_WORKLOGS",

  // Sprint Permissions
  MANAGE_SPRINTS = "MANAGE_SPRINTS",
  VIEW_SPRINTS = "VIEW_SPRINTS",

  // Epic Permissions
  MANAGE_EPICS = "MANAGE_EPICS",
  VIEW_EPICS = "VIEW_EPICS",
}

// Board Types
export enum BoardType {
  SCRUM = "SCRUM",
  KANBAN = "KANBAN",
}

// Workflow Status (for board columns)
export enum WorkflowStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  CUSTOM = "CUSTOM",
}

// Sprint Status
export enum SprintStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// Dependency Types
export enum DependencyType {
  BLOCKS = "BLOCKS",
  IS_BLOCKED_BY = "IS_BLOCKED_BY",
  RELATES_TO = "RELATES_TO",
}

// Status Transition Map
export const ALLOWED_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.DRAFT]: [TaskStatus.ASSIGNED],
  [TaskStatus.ASSIGNED]: [TaskStatus.IN_PROGRESS, TaskStatus.REJECTED],
  [TaskStatus.IN_PROGRESS]: [
    TaskStatus.PAUSED,
    TaskStatus.REVIEW,
    TaskStatus.COMPLETED,
  ],
  [TaskStatus.PAUSED]: [TaskStatus.IN_PROGRESS, TaskStatus.REJECTED],
  [TaskStatus.REVIEW]: [
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
    TaskStatus.REJECTED,
  ],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.REJECTED]: [TaskStatus.DRAFT],
};

// Role Hierarchy
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.CEO]: 80,
  [UserRole.HOO]: 60,
  [UserRole.HR]: 60,
  [UserRole.ADMIN]: 40,
  [UserRole.STAFF]: 20,
};

// Project Role Hierarchy
export const PROJECT_ROLE_HIERARCHY: Record<ProjectRole, number> = {
  [ProjectRole.PROJECT_ADMIN]: 4,
  [ProjectRole.PROJECT_LEAD]: 3,
  [ProjectRole.DEVELOPER]: 2,
  [ProjectRole.REPORTER]: 1,
  [ProjectRole.VIEWER]: 0,
};
