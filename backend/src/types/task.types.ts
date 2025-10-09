import { Priority, TaskType } from '@prisma/client';

// Task Management Types
export interface Task {
  id: string;
  key: string;
  title: string;
  description?: string;
  type: TaskType;
  status: string;
  currentStateId?: string;
  workflowId?: string;
  priority?: Priority;
  assigneeId?: string;
  reporterId: string;
  projectId: string;
  parentId?: string;
  estimatedHours?: number;
  remainingHours?: number;
  loggedHours: number;
  dueDate?: Date;
  labels: string[];
  components: string[];
  storyPoints?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  type: TaskType;
  priority?: Priority;
  assigneeId?: string;
  projectId: string;
  parentId?: string;
  estimatedHours?: number;
  dueDate?: Date;
  labels?: string[];
  components?: string[];
  storyPoints?: number;
  workflowId?: string;
  customFields?: Record<string, any>;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  type?: TaskType;
  status?: string;
  priority?: Priority;
  assigneeId?: string;
  parentId?: string;
  estimatedHours?: number;
  remainingHours?: number;
  dueDate?: Date;
  labels?: string[];
  components?: string[];
  storyPoints?: number;
  customFields?: Record<string, any>;
}

export interface TaskFilters {
  projectId?: string;
  assigneeId?: string;
  reporterId?: string;
  type?: TaskType;
  status?: string;
  priority?: Priority;
  parentId?: string;
  labels?: string[];
  components?: string[];
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  search?: string;
  includeSubtasks?: boolean;
}

export interface TaskStatusTransition {
  taskId: string;
  fromStatus: string;
  toStatus: string;
  comment?: string;
  userId: string;
  transitionId?: string;
}

export interface TaskAssignment {
  taskId: string;
  assigneeId: string;
  assignedBy: string;
  comment?: string;
}

export interface TaskTimeEntry {
  taskId: string;
  userId: string;
  hours: number;
  description?: string;
  date: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  parentId?: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface TaskDependency {
  id: string;
  dependentTaskId: string;
  blockingTaskId: string;
  type: 'BLOCKS' | 'IS_BLOCKED_BY' | 'RELATES_TO';
  createdAt: Date;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
  comment?: string;
  createdAt: Date;
}

export interface TaskStatistics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byAssignee: Record<string, number>;
  overdue: number;
  completed: number;
  inProgress: number;
  averageCompletionTime?: number;
}

export interface TaskValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TaskNotificationEvent {
  type: 'CREATED' | 'UPDATED' | 'ASSIGNED' | 'STATUS_CHANGED' | 'COMMENTED' | 'DUE_SOON' | 'OVERDUE';
  taskId: string;
  userId: string;
  data: Record<string, any>;
  recipients: string[];
}

export interface TaskBulkOperation {
  taskIds: string[];
  operation: 'UPDATE' | 'DELETE' | 'ASSIGN' | 'STATUS_CHANGE';
  data: Record<string, any>;
}

export interface TaskBulkResult {
  successful: string[];
  failed: Array<{
    taskId: string;
    error: string;
  }>;
  warnings: string[];
}

// Task Query Options
export interface TaskQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeSubtasks?: boolean;
  includeComments?: boolean;
  includeAttachments?: boolean;
  includeTimeEntries?: boolean;
  includeCustomFields?: boolean;
}

// Task Creation Context
export interface TaskCreationContext {
  projectId: string;
  userId: string;
  templateId?: string;
  parentTaskId?: string;
  sprintId?: string;
  workflowId?: string;
}

// Task Update Context
export interface TaskUpdateContext {
  taskId: string;
  userId: string;
  reason?: string;
  notifyAssignee?: boolean;
  notifyWatchers?: boolean;
}

// Task Status Configuration
export interface TaskStatusConfig {
  status: string;
  name: string;
  category: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  color: string;
  allowedTransitions: string[];
  requiredFields?: string[];
  autoAssign?: boolean;
}

// Task Template
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  type: TaskType;
  priority?: Priority;
  estimatedHours?: number;
  labels: string[];
  components: string[];
  customFields: Record<string, any>;
  subtasks?: Omit<TaskTemplate, 'id' | 'subtasks'>[];
}

// Task Metrics
export interface TaskMetrics {
  taskId: string;
  cycleTime?: number; // Time from start to completion
  leadTime?: number; // Time from creation to completion
  timeInStatus: Record<string, number>;
  blockedTime?: number;
  reopenCount: number;
  commentCount: number;
  attachmentCount: number;
}

// Task Search Result
export interface TaskSearchResult {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  aggregations?: {
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    byAssignee: Record<string, number>;
  };
}

// Task Validation Rules
export interface TaskValidationRules {
  titleMinLength: number;
  titleMaxLength: number;
  descriptionMaxLength: number;
  maxLabels: number;
  maxComponents: number;
  maxStoryPoints: number;
  requiredFields: string[];
  allowedTypes: TaskType[];
  allowedPriorities: Priority[];
}

// Task Workflow State
export interface TaskWorkflowState {
  taskId: string;
  workflowId: string;
  currentStateId: string;
  availableTransitions: Array<{
    id: string;
    name: string;
    toStateId: string;
    conditions?: any[];
  }>;
}

export { TaskType, Priority } from '@prisma/client';