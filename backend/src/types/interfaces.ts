import {
  UserRole,
  TaskStatus,
  TaskPriority,
  IssueType,
  NotificationType,
  ActivityAction,
} from "./enums";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  issueType: IssueType;
  status: TaskStatus;
  creatorId: string;
  assigneeId: string | null;
  parentTaskId: string | null;
  requiresApproval: boolean;
  approvedById: string | null;
  rejectionReason: string | null;
  labels: string[];
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  message: string;
  createdAt: Date;
}

export interface TaskActivityLog {
  id: string;
  taskId: string;
  userId: string;
  action: ActivityAction;
  previousStatus: TaskStatus | null;
  newStatus: TaskStatus | null;
  metadata: Record<string, any> | null;
  timestamp: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export interface CreateProjectDTO {
  name: string;
  key: string; // Project key like "PROJ", "DEV"
  description?: string;
  workflowType?: string; // BASIC, AGILE, BUG_TRACKING, or CUSTOM
  workflowSchemeId?: string; // Only used when workflowType = CUSTOM
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  workflowType?: string;
  workflowSchemeId?: string;
}

export interface CreateTaskDTO {
  projectId?: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  issueType?: IssueType;
  assigneeId?: string;
  parentTaskId?: string;
  labels?: string[];
  dueDate?: Date;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  issueType?: IssueType;
  labels?: string[];
  dueDate?: Date;
}

export interface AssignTaskDTO {
  assigneeId: string;
}

export interface ApproveTaskDTO {
  approvedById: string;
}

export interface RejectTaskDTO {
  rejectionReason: string;
}

export interface ChangeStatusDTO {
  status: TaskStatus;
}

export interface CreateCommentDTO {
  message: string;
}
