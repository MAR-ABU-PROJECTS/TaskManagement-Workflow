// // Task Types for Frontend
// export enum TaskType {
//   EPIC = 'EPIC',
//   STORY = 'STORY',
//   TASK = 'TASK',
//   SUBTASK = 'SUBTASK'
// }

// export enum Priority {
//   LOWEST = 'LOWEST',
//   LOW = 'LOW',
//   MEDIUM = 'MEDIUM',
//   HIGH = 'HIGH',
//   HIGHEST = 'HIGHEST'
// }

// export enum DependencyType {
//   BLOCKS = 'BLOCKS',
//   IS_BLOCKED_BY = 'IS_BLOCKED_BY',
//   RELATES_TO = 'RELATES_TO'
// }

// export interface Task {
//   id: string;
//   key: string;
//   title: string;
//   description?: string;
//   type: TaskType;
//   status: string;
//   currentStateId?: string;
//   workflowId?: string;
//   priority?: Priority;
//   assigneeId?: string;
//   reporterId: string;
//   projectId: string;
//   parentId?: string;
//   estimatedHours?: number;
//   remainingHours?: number;
//   loggedHours: number;
//   dueDate?: string;
//   labels: string[];
//   components: string[];
//   storyPoints?: number;
//   createdAt: string;
//   updatedAt: string;
//   // Populated fields
//   assignee?: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//   };
//   reporter?: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//   };
//   project?: {
//     id: string;
//     name: string;
//     key: string;
//   };
//   parent?: {
//     id: string;
//     key: string;
//     title: string;
//   };
//   subtasks?: Task[];
//   comments?: TaskComment[];
//   attachments?: TaskAttachment[];
//   timeEntries?: TaskTimeEntry[];
//   customFieldValues?: TaskCustomFieldValue[];
// }

// export interface CreateTaskRequest {
//   title: string;
//   description?: string;
//   type: TaskType;
//   priority?: Priority;
//   assigneeId?: string;
//   projectId: string;
//   parentId?: string;
//   estimatedHours?: number;
//   dueDate?: string;
//   labels?: string[];
//   components?: string[];
//   storyPoints?: number;
//   workflowId?: string;
//   customFields?: Record<string, any>;
// }

// export interface UpdateTaskRequest {
//   title?: string;
//   description?: string;
//   type?: TaskType;
//   status?: string;
//   priority?: Priority;
//   assigneeId?: string;
//   parentId?: string;
//   estimatedHours?: number;
//   remainingHours?: number;
//   dueDate?: string;
//   labels?: string[];
//   components?: string[];
//   storyPoints?: number;
//   customFields?: Record<string, any>;
// }

// export interface TaskFilters {
//   projectId?: string;
//   assigneeId?: string;
//   reporterId?: string;
//   type?: TaskType;
//   status?: string;
//   priority?: Priority;
//   parentId?: string;
//   labels?: string[];
//   components?: string[];
//   dueDate?: {
//     from?: string;
//     to?: string;
//   };
//   search?: string;
//   includeSubtasks?: boolean;
// }

// export interface TaskQueryOptions {
//   page?: number;
//   limit?: number;
//   sortBy?: string;
//   sortOrder?: 'asc' | 'desc';
//   includeSubtasks?: boolean;
//   includeComments?: boolean;
//   includeAttachments?: boolean;
//   includeTimeEntries?: boolean;
//   includeCustomFields?: boolean;
// }

// export interface TaskSearchResult {
//   tasks: Task[];
//   total: number;
//   page: number;
//   limit: number;
//   hasMore: boolean;
//   aggregations?: {
//     byStatus: Record<string, number>;
//     byType: Record<string, number>;
//     byPriority: Record<string, number>;
//     byAssignee: Record<string, number>;
//   };
// }

// export interface TaskStatistics {
//   total: number;
//   byStatus: Record<string, number>;
//   byType: Record<string, number>;
//   byPriority: Record<string, number>;
//   byAssignee: Record<string, number>;
//   overdue: number;
//   completed: number;
//   inProgress: number;
//   averageCompletionTime?: number;
// }

// export interface TaskComment {
//   id: string;
//   taskId: string;
//   authorId: string;
//   content: string;
//   parentId?: string;
//   mentions: string[];
//   createdAt: string;
//   updatedAt: string;
//   author?: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//   };
//   replies?: TaskComment[];
// }

// export interface TaskAttachment {
//   id: string;
//   taskId: string;
//   filename: string;
//   originalName: string;
//   mimeType: string;
//   size: number;
//   path: string;
//   uploadedBy: string;
//   createdAt: string;
// }

// export interface TaskTimeEntry {
//   id: string;
//   taskId: string;
//   userId: string;
//   hours: number;
//   description?: string;
//   date: string;
//   createdAt: string;
//   updatedAt: string;
//   user?: {
//     id: string;
//     firstName: string;
//     lastName: string;
//   };
// }

// export interface TaskCustomFieldValue {
//   id: string;
//   customFieldId: string;
//   taskId: string;
//   value: any;
//   customField?: {
//     id: string;
//     name: string;
//     type: string;
//     options?: any[];
//   };
// }

// // Task Dependency Types
// export interface TaskDependency {
//   id: string;
//   dependentTaskId: string;
//   blockingTaskId: string;
//   type: DependencyType;
//   createdAt: string;
//   dependentTask?: {
//     id: string;
//     key: string;
//     title: string;
//     status: string;
//     projectId: string;
//   };
//   blockingTask?: {
//     id: string;
//     key: string;
//     title: string;
//     status: string;
//     projectId: string;
//   };
// }

// export interface TaskBlockingInfo {
//   taskId: string;
//   isBlocked: boolean;
//   blockedBy: Array<{
//     taskId: string;
//     taskKey: string;
//     title: string;
//     status: string;
//     type: DependencyType;
//   }>;
//   blocking: Array<{
//     taskId: string;
//     taskKey: string;
//     title: string;
//     status: string;
//     type: DependencyType;
//   }>;
//   canStart: boolean;
//   blockedReason?: string;
// }

// export interface SubtaskSummary {
//   parentTaskId: string;
//   totalSubtasks: number;
//   completedSubtasks: number;
//   inProgressSubtasks: number;
//   todoSubtasks: number;
//   completionPercentage: number;
//   estimatedHours: number;
//   loggedHours: number;
//   remainingHours: number;
// }

// export interface TaskTreeNode {
//   task: {
//     id: string;
//     key: string;
//     title: string;
//     status: string;
//     type: string;
//     priority?: string;
//     assigneeId?: string;
//     estimatedHours?: number;
//     completionPercentage?: number;
//   };
//   children: TaskTreeNode[];
//   depth: number;
//   hasChildren: boolean;
//   isExpanded?: boolean;
// }

// // UI State Types
// export interface TaskFormData {
//   title: string;
//   description: string;
//   type: TaskType;
//   priority: Priority;
//   assigneeId: string;
//   parentId: string;
//   estimatedHours: number;
//   dueDate: string;
//   labels: string[];
//   components: string[];
//   storyPoints: number;
// }

// export interface TaskListViewState {
//   view: 'list' | 'board' | 'tree';
//   filters: TaskFilters;
//   sortBy: string;
//   sortOrder: 'asc' | 'desc';
//   selectedTasks: string[];
//   groupBy?: 'status' | 'assignee' | 'priority' | 'type';
// }

// export interface TaskBoardColumn {
//   id: string;
//   title: string;
//   status: string;
//   tasks: Task[];
//   color?: string;
//   wipLimit?: number;
// }

// // API Response Types
// export interface ApiResponse<T> {
//   success: boolean;
//   data: T;
//   message?: string;
//   pagination?: {
//     page: number;
//     limit: number;
//     total: number;
//     hasMore: boolean;
//   };
//   aggregations?: any;
// }

// export interface BulkTaskOperation {
//   taskIds: string[];
//   operation: 'UPDATE' | 'DELETE' | 'ASSIGN' | 'STATUS_CHANGE';
//   data: Record<string, any>;
// }

// export interface BulkTaskResult {
//   successful: string[];
//   failed: Array<{
//     taskId: string;
//     error: string;
//   }>;
//   warnings: string[];
// }