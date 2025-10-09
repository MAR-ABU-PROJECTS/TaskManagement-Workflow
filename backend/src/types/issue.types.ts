import { 
  Issue, 
  IssueType, 
  IssueSeverity,
  Priority,
  Comment,
  TimeEntry,
  Attachment,
  CustomFieldValue
} from '@prisma/client';
import { IUser } from './user.types';
import { IProject, IWorkflowStatus } from './project.types';
import { ITask } from './task.types';

// Core Issue Types
export interface IIssue extends Issue {
  status?: IWorkflowStatus;
  assignee?: IUser;
  reporter?: IUser;
  project?: IProject;
  task?: ITask;
  attachments?: IAttachment[];
  comments?: IComment[];
  timeEntries?: ITimeEntry[];
  customFieldValues?: ICustomFieldValue[];
  _count?: {
    comments: number;
    timeEntries: number;
    attachments: number;
  };
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  type: IssueType;
  priority?: Priority;
  severity?: IssueSeverity;
  assigneeId?: string;
  projectId: string;
  taskId?: string;
  environment?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  labels?: string[];
  customFields?: Record<string, any>;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  type?: IssueType;
  priority?: Priority;
  severity?: IssueSeverity;
  assigneeId?: string;
  taskId?: string;
  environment?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  labels?: string[];
  customFields?: Record<string, any>;
}

export interface TransitionIssueRequest {
  statusId: string;
  comment?: string;
}

export interface AssignIssueRequest {
  assigneeId: string;
  comment?: string;
}

// Issue Query Types
export interface IssueFilters {
  type?: IssueType;
  status?: string;
  priority?: Priority;
  severity?: IssueSeverity;
  assigneeId?: string;
  reporterId?: string;
  projectId?: string;
  taskId?: string;
  environment?: string;
  labels?: string[];
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface IssueListQuery extends IssueFilters {
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'priority' | 'severity' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  includeCounts?: boolean;
}

// Issue Statistics
export interface IssueStats {
  totalIssues: number;
  issuesByType: Record<IssueType, number>;
  issuesByStatus: Record<string, number>;
  issuesByPriority: Record<Priority, number>;
  issuesBySeverity: Record<IssueSeverity, number>;
  openIssues: number;
  resolvedIssues: number;
  averageResolutionTime: number;
  totalTimeLogged: number;
}

// Issue Resolution Metrics
export interface IssueResolutionMetrics {
  issueId: string;
  reportedAt: Date;
  resolvedAt?: Date;
  resolutionTime?: number; // in hours
  firstResponseTime?: number; // in hours
  reopenCount: number;
  escalationLevel: number;
  satisfactionRating?: number;
}

// Issue Bulk Operations
export interface BulkIssueUpdateRequest {
  issueIds: string[];
  updates: Partial<UpdateIssueRequest>;
}

export interface BulkIssueTransitionRequest {
  issueIds: string[];
  statusId: string;
  comment?: string;
}

// Issue Import/Export Types
export interface IssueImportRequest {
  projectId: string;
  issues: CreateIssueRequest[];
  mapping?: Record<string, string>;
}

export interface IssueExportRequest {
  projectId?: string;
  taskId?: string;
  filters?: IssueFilters;
  format: 'csv' | 'excel' | 'json';
  fields?: string[];
}

// Issue Templates
export interface IssueTemplate {
  id: string;
  name: string;
  type: IssueType;
  title: string;
  description: string;
  priority?: Priority;
  severity?: IssueSeverity;
  labels: string[];
  customFields: Record<string, any>;
  isActive: boolean;
}

export interface CreateIssueFromTemplateRequest {
  templateId: string;
  title?: string;
  description?: string;
  assigneeId?: string;
  projectId: string;
  taskId?: string;
  customFields?: Record<string, any>;
}

// Issue Escalation
export interface IssueEscalation {
  issueId: string;
  level: number;
  escalatedAt: Date;
  escalatedBy: string;
  escalatedTo: string;
  reason: string;
  isActive: boolean;
}

export interface EscalateIssueRequest {
  issueId: string;
  escalatedTo: string;
  reason: string;
  priority?: Priority;
  severity?: IssueSeverity;
}

// Issue SLA (Service Level Agreement)
export interface IssueSLA {
  type: IssueType;
  priority: Priority;
  severity: IssueSeverity;
  firstResponseTime: number; // in hours
  resolutionTime: number; // in hours
  escalationTime: number; // in hours
}

export interface IssueSLAStatus {
  issueId: string;
  sla: IssueSLA;
  firstResponseDue: Date;
  resolutionDue: Date;
  escalationDue: Date;
  isFirstResponseBreached: boolean;
  isResolutionBreached: boolean;
  isEscalationBreached: boolean;
}

// Issue Workflow
export interface IssueWorkflow {
  type: IssueType;
  statuses: string[];
  transitions: {
    from: string;
    to: string;
    conditions?: any;
  }[];
}

// Export enums for convenience
export { 
  IssueType, 
  IssueSeverity,
  Priority 
} from '@prisma/client';

// Re-export shared types
export type IComment = Comment & {
  author?: IUser;
  parent?: IComment;
  replies?: IComment[];
};

export type ITimeEntry = TimeEntry & {
  user?: IUser;
  issue?: IIssue;
};

export type IAttachment = Attachment & {
  issue?: IIssue;
};

export type ICustomFieldValue = CustomFieldValue & {
  customField?: {
    name: string;
    type: string;
    options?: string[];
  };
};