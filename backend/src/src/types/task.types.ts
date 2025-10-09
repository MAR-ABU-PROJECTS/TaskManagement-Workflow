import { 
  Task, 
  TaskType, 
  Priority,
  TaskDependency,
  DependencyType,
  Comment,
  TimeEntry,
  Attachment,
  CustomFieldValue
} from '@prisma/client';
import { IUser } from './user.types';
import { IProject, IWorkflowStatus } from './project.types';

// Core Task Types
export interface ITask extends Task {
  status?: IWorkflowStatus;
  assignee?: IUser;
  reporter?: IUser;
  project?: IProject;
  parent?: ITask;
  subtasks?: ITask[];
  dependencies?: ITaskDependency[];
  dependents?: ITaskDependency[];
  attachments?: IAttachment[];
  comments?: IComment[];
  timeEntries?: ITimeEntry[];
  customFieldValues?: ICustomFieldValue[];
  _count?: {
    subtasks: number;
    comments: number;
    timeEntries: number;
    attachments: number;
  };
}

export interface ITaskDependency extends TaskDependency {
  dependentTask?: ITask;
  blockingTask?: ITask;
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
  customFields?: Record<string, any>;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  type?: TaskType;
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

export interface TransitionTaskRequest {
  statusId: string;
  comment?: string;
}

export interface AssignTaskRequest {
  assigneeId: string;
  comment?: string;
}

// Task Dependency Types
export interface CreateTaskDependencyRequest {
  dependentTaskId: string;
  blockingTaskId: string;
  type: DependencyType;
}

// Comment Types
export interface IComment extends Comment {
  author?: IUser;
  parent?: IComment;
  replies?: IComment[];
  _count?: {
    replies: number;
  };
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
  mentions?: string[];
}

export interface UpdateCommentRequest {
  content: string;
  mentions?: string[];
}

// Time Entry Types
export interface ITimeEntry extends TimeEntry {
  task?: ITask;
  user?: IUser;
}

export interface CreateTimeEntryRequest {
  taskId: string;
  hours: number;
  description?: string;
  date: Date;
}

export interface UpdateTimeEntryRequest {
  hours?: number;
  description?: string;
  date?: Date;
}

// Attachment Types
export interface IAttachment extends Attachment {
  task?: ITask;
}

export interface CreateAttachmentRequest {
  taskId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: string;
}

// Custom Field Value Types
export interface ICustomFieldValue extends CustomFieldValue {
  customField?: {
    name: string;
    type: string;
    options?: string[];
  };
}

// Task Query Types
export interface TaskFilters {
  type?: TaskType;
  status?: string;
  priority?: Priority;
  assigneeId?: string;
  reporterId?: string;
  projectId?: string;
  parentId?: string;
  labels?: string[];
  components?: string[];
  search?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface TaskListQuery extends TaskFilters {
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  includeCounts?: boolean;
  includeSubtasks?: boolean;
}

// Task Statistics
export interface TaskStats {
  totalTasks: number;
  tasksByType: Record<TaskType, number>;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<Priority, number>;
  overdueTasks: number;
  completedTasks: number;
  averageCompletionTime: number;
  totalTimeLogged: number;
}

// Task Board Types
export interface TaskBoard {
  id: string;
  name: string;
  projectId: string;
  columns: TaskBoardColumn[];
  swimlanes?: TaskBoardSwimlane[];
  filters?: TaskFilters;
}

export interface TaskBoardColumn {
  id: string;
  name: string;
  statusId: string;
  order: number;
  wipLimit?: number;
  tasks: ITask[];
}

export interface TaskBoardSwimlane {
  id: string;
  name: string;
  type: 'assignee' | 'priority' | 'component' | 'custom';
  value: string;
  tasks: ITask[];
}

// Task Import/Export Types
export interface TaskImportRequest {
  projectId: string;
  tasks: CreateTaskRequest[];
  mapping?: Record<string, string>;
}

export interface TaskExportRequest {
  projectId?: string;
  filters?: TaskFilters;
  format: 'csv' | 'excel' | 'json';
  fields?: string[];
}

// Task Bulk Operations
export interface BulkTaskUpdateRequest {
  taskIds: string[];
  updates: Partial<UpdateTaskRequest>;
}

export interface BulkTaskTransitionRequest {
  taskIds: string[];
  statusId: string;
  comment?: string;
}

// Export enums for convenience
export { 
  TaskType, 
  Priority, 
  DependencyType 
} from '@prisma/client';