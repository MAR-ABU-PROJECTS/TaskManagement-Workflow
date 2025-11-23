// User Roles
export enum UserRole {
  CEO = "CEO",
  HOO = "HOO",
  HR = "HR",
  ADMIN = "ADMIN",
  STAFF = "STAFF",
}

// Departments
export enum Department {
  OPS = "OPS",
  HR = "HR",
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
  [UserRole.CEO]: 5,
  [UserRole.HOO]: 4,
  [UserRole.HR]: 3,
  [UserRole.ADMIN]: 2,
  [UserRole.STAFF]: 1,
};
