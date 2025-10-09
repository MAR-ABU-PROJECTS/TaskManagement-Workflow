import { BaseModel } from './BaseModel';
import { Task, TaskType, TaskStatus, TaskPriority } from '../types/task.types';

export class TaskModel extends BaseModel {
  /**
   * Validate task data
   */
  static validateTaskData(data: Partial<Task>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate title
    if (data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        errors.push('Title is required');
      } else if (data.title.length > 500) {
        errors.push('Title cannot exceed 500 characters');
      }
    }

    // Validate description
    if (data.description !== undefined && data.description.length > 10000) {
      errors.push('Description cannot exceed 10000 characters');
    }

    // Validate type
    if (data.type !== undefined && !Object.values(TaskType).includes(data.type)) {
      errors.push(`Invalid task type. Must be one of: ${Object.values(TaskType).join(', ')}`);
    }

    // Validate status
    if (data.status !== undefined && !Object.values(TaskStatus).includes(data.status)) {
      errors.push(`Invalid task status. Must be one of: ${Object.values(TaskStatus).join(', ')}`);
    }

    // Validate priority
    if (data.priority !== undefined && !Object.values(TaskPriority).includes(data.priority)) {
      errors.push(`Invalid task priority. Must be one of: ${Object.values(TaskPriority).join(', ')}`);
    }

    // Validate estimated hours
    if (data.estimatedHours !== undefined) {
      if (data.estimatedHours < 0) {
        errors.push('Estimated hours cannot be negative');
      } else if (data.estimatedHours > 9999) {
        errors.push('Estimated hours cannot exceed 9999');
      }
    }

    // Validate remaining hours
    if (data.remainingHours !== undefined) {
      if (data.remainingHours < 0) {
        errors.push('Remaining hours cannot be negative');
      } else if (data.remainingHours > 9999) {
        errors.push('Remaining hours cannot exceed 9999');
      }
    }

    // Validate logged hours
    if (data.loggedHours !== undefined) {
      if (data.loggedHours < 0) {
        errors.push('Logged hours cannot be negative');
      } else if (data.loggedHours > 9999) {
        errors.push('Logged hours cannot exceed 9999');
      }
    }

    // Validate labels
    if (data.labels !== undefined) {
      if (data.labels.length > 20) {
        errors.push('Cannot have more than 20 labels');
      }
      
      for (const label of data.labels) {
        if (label.length > 50) {
          errors.push('Label cannot exceed 50 characters');
          break;
        }
      }
    }

    // Validate components
    if (data.components !== undefined) {
      if (data.components.length > 10) {
        errors.push('Cannot have more than 10 components');
      }
      
      for (const component of data.components) {
        if (component.length > 100) {
          errors.push('Component cannot exceed 100 characters');
          break;
        }
      }
    }

    // Validate due date
    if (data.dueDate !== undefined && data.dueDate instanceof Date && isNaN(data.dueDate.getTime())) {
      errors.push('Due date must be a valid date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if task can transition to new status
   */
  static canTransitionStatus(currentStatus: TaskStatus, newStatus: TaskStatus): boolean {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED, TaskStatus.CANCELLED],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.IN_REVIEW, TaskStatus.TESTING, TaskStatus.BLOCKED, TaskStatus.TODO, TaskStatus.CANCELLED],
      [TaskStatus.IN_REVIEW]: [TaskStatus.IN_PROGRESS, TaskStatus.TESTING, TaskStatus.DONE, TaskStatus.BLOCKED],
      [TaskStatus.TESTING]: [TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.DONE, TaskStatus.BLOCKED],
      [TaskStatus.BLOCKED]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW], // Allow reopening
      [TaskStatus.CANCELLED]: [TaskStatus.TODO] // Allow reactivation
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Get task priority weight for sorting
   */
  static getPriorityWeight(priority: TaskPriority): number {
    const weights: Record<TaskPriority, number> = {
      [TaskPriority.LOWEST]: 1,
      [TaskPriority.LOW]: 2,
      [TaskPriority.MEDIUM]: 3,
      [TaskPriority.HIGH]: 4,
      [TaskPriority.HIGHEST]: 5
    };

    return weights[priority] || 3;
  }

  /**
   * Check if task is overdue
   */
  static isOverdue(task: Task): boolean {
    if (!task.dueDate) {
      return false;
    }

    const now = new Date();
    const dueDate = new Date(task.dueDate);
    
    return dueDate < now && 
           task.status !== TaskStatus.DONE && 
           task.status !== TaskStatus.CANCELLED;
  }

  /**
   * Calculate task completion percentage
   */
  static getCompletionPercentage(task: Task): number {
    if (!task.estimatedHours || task.estimatedHours === 0) {
      // If no estimate, base on status
      switch (task.status) {
        case TaskStatus.TODO:
          return 0;
        case TaskStatus.IN_PROGRESS:
          return 25;
        case TaskStatus.IN_REVIEW:
          return 75;
        case TaskStatus.TESTING:
          return 90;
        case TaskStatus.DONE:
          return 100;
        case TaskStatus.BLOCKED:
        case TaskStatus.CANCELLED:
          return 0;
        default:
          return 0;
      }
    }

    // Calculate based on remaining hours
    const completedHours = task.estimatedHours - (task.remainingHours || 0);
    return Math.min(100, Math.max(0, (completedHours / task.estimatedHours) * 100));
  }

  /**
   * Generate task summary for notifications
   */
  static generateTaskSummary(task: Task): string {
    const assignee = task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned';
    const dueDate = task.dueDate ? ` (Due: ${new Date(task.dueDate).toLocaleDateString()})` : '';
    
    return `${task.key}: ${task.title} - ${task.status} - Assigned to: ${assignee}${dueDate}`;
  }

  /**
   * Validate task key format
   */
  static isValidTaskKey(key: string): boolean {
    const keyPattern = /^[A-Z]+-\d+$/;
    return keyPattern.test(key);
  }

  /**
   * Extract project key from task key
   */
  static getProjectKeyFromTaskKey(taskKey: string): string | null {
    const match = taskKey.match(/^([A-Z]+)-\d+$/);
    return match ? match[1] : null;
  }

  /**
   * Extract task number from task key
   */
  static getTaskNumberFromKey(taskKey: string): number | null {
    const match = taskKey.match(/^[A-Z]+-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }
}