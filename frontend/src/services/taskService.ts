import axios from 'axios';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  TaskQueryOptions,
  TaskSearchResult,
  TaskStatistics,
  TaskDependency,
  TaskBlockingInfo,
  SubtaskSummary,
  TaskTreeNode,
  BulkTaskOperation,
  BulkTaskResult,
  ApiResponse,
  DependencyType
} from '../types/task.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export class TaskService {
  // Task CRUD Operations
  static async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>('/tasks', taskData);
    return response.data.data;
  }

  static async getTask(taskId: string, options?: TaskQueryOptions): Promise<Task> {
    const params = new URLSearchParams();
    if (options?.includeSubtasks) params.append('includeSubtasks', 'true');
    if (options?.includeComments) params.append('includeComments', 'true');
    if (options?.includeAttachments) params.append('includeAttachments', 'true');
    if (options?.includeTimeEntries) params.append('includeTimeEntries', 'true');
    if (options?.includeCustomFields) params.append('includeCustomFields', 'true');

    const response = await api.get<ApiResponse<Task>>(`/tasks/${taskId}?${params}`);
    return response.data.data;
  }

  static async getTaskByKey(taskKey: string, options?: TaskQueryOptions): Promise<Task> {
    const params = new URLSearchParams();
    if (options?.includeSubtasks) params.append('includeSubtasks', 'true');
    if (options?.includeComments) params.append('includeComments', 'true');
    if (options?.includeAttachments) params.append('includeAttachments', 'true');
    if (options?.includeTimeEntries) params.append('includeTimeEntries', 'true');
    if (options?.includeCustomFields) params.append('includeCustomFields', 'true');

    const response = await api.get<ApiResponse<Task>>(`/tasks/key/${taskKey}?${params}`);
    return response.data.data;
  }

  static async searchTasks(filters: TaskFilters = {}, options: TaskQueryOptions = {}): Promise<TaskSearchResult> {
    const params = new URLSearchParams();

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else if (typeof value === 'object' && key === 'dueDate') {
          if (value.from) params.append('dueDateFrom', value.from);
          if (value.to) params.append('dueDateTo', value.to);
        } else {
          params.append(key, value.toString());
        }
      }
    });

    // Add options
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.includeSubtasks) params.append('includeSubtasks', 'true');

    const response = await api.get<ApiResponse<Task[]>>(`/tasks?${params}`);
    return {
      tasks: response.data.data,
      total: response.data.pagination?.total || 0,
      page: response.data.pagination?.page || 1,
      limit: response.data.pagination?.limit || 50,
      hasMore: response.data.pagination?.hasMore || false,
      aggregations: response.data.aggregations
    };
  }

  static async updateTask(taskId: string, updateData: UpdateTaskRequest): Promise<Task> {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${taskId}`, updateData);
    return response.data.data;
  }

  static async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
  }

  static async assignTask(taskId: string, assigneeId: string, comment?: string): Promise<Task> {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${taskId}/assign`, {
      assigneeId,
      comment
    });
    return response.data.data;
  }

  static async transitionTaskStatus(
    taskId: string,
    toStatus: string,
    comment?: string,
    transitionId?: string
  ): Promise<Task> {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${taskId}/status`, {
      toStatus,
      comment,
      transitionId
    });
    return response.data.data;
  }

  static async getTaskStatistics(filters: TaskFilters = {}): Promise<TaskStatistics> {
    const params = new URLSearchParams();
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);

    const response = await api.get<ApiResponse<TaskStatistics>>(`/tasks/statistics?${params}`);
    return response.data.data;
  }

  static async bulkOperation(operation: BulkTaskOperation): Promise<BulkTaskResult> {
    const response = await api.post<ApiResponse<BulkTaskResult>>('/tasks/bulk', operation);
    return response.data.data;
  }

  // Task Dependency Operations
  static async createDependency(
    dependentTaskId: string,
    blockingTaskId: string,
    type: DependencyType
  ): Promise<TaskDependency> {
    const response = await api.post<ApiResponse<TaskDependency>>('/task-dependencies', {
      dependentTaskId,
      blockingTaskId,
      type
    });
    return response.data.data;
  }

  static async getDependencies(filters: {
    taskId?: string;
    projectId?: string;
    type?: DependencyType;
  } = {}): Promise<TaskDependency[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await api.get<ApiResponse<TaskDependency[]>>(`/task-dependencies?${params}`);
    return response.data.data;
  }

  static async deleteDependency(dependencyId: string): Promise<void> {
    await api.delete(`/task-dependencies/${dependencyId}`);
  }

  static async getTaskBlockingInfo(taskId: string): Promise<TaskBlockingInfo> {
    const response = await api.get<ApiResponse<TaskBlockingInfo>>(
      `/task-dependencies/tasks/${taskId}/blocking-info`
    );
    return response.data.data;
  }

  static async getSubtaskSummary(taskId: string): Promise<SubtaskSummary> {
    const response = await api.get<ApiResponse<SubtaskSummary>>(
      `/task-dependencies/tasks/${taskId}/subtask-summary`
    );
    return response.data.data;
  }

  static async getTaskTree(taskId: string, maxDepth?: number): Promise<TaskTreeNode> {
    const params = new URLSearchParams();
    if (maxDepth) params.append('maxDepth', maxDepth.toString());

    const response = await api.get<ApiResponse<TaskTreeNode>>(
      `/task-dependencies/tasks/${taskId}/tree?${params}`
    );
    return response.data.data;
  }

  static async moveTask(taskId: string, newParentId?: string, position?: number): Promise<void> {
    await api.put(`/task-dependencies/tasks/${taskId}/move`, {
      newParentId,
      position
    });
  }

  // Task Comments
  static async addComment(taskId: string, content: string, parentId?: string): Promise<void> {
    await api.post(`/tasks/${taskId}/comments`, {
      content,
      parentId
    });
  }

  static async updateComment(commentId: string, content: string): Promise<void> {
    await api.put(`/comments/${commentId}`, { content });
  }

  static async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}`);
  }

  // Task Time Tracking
  static async logTime(
    taskId: string,
    hours: number,
    description?: string,
    date?: string
  ): Promise<void> {
    await api.post(`/tasks/${taskId}/time`, {
      hours,
      description,
      date: date || new Date().toISOString()
    });
  }

  static async updateTimeEntry(entryId: string, hours: number, description?: string): Promise<void> {
    await api.put(`/time-entries/${entryId}`, {
      hours,
      description
    });
  }

  static async deleteTimeEntry(entryId: string): Promise<void> {
    await api.delete(`/time-entries/${entryId}`);
  }

  // Task Attachments
  static async uploadAttachment(taskId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  static async deleteAttachment(attachmentId: string): Promise<void> {
    await api.delete(`/attachments/${attachmentId}`);
  }

  static getAttachmentUrl(attachmentId: string): string {
    return `${API_BASE_URL}/attachments/${attachmentId}/download`;
  }
}

export default TaskService;