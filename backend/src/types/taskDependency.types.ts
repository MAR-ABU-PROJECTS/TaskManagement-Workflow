import { DependencyType } from '@prisma/client';

// Task Dependency Types
export interface TaskDependency {
  id: string;
  dependentTaskId: string;
  blockingTaskId: string;
  type: DependencyType;
  createdAt: Date;
  dependentTask?: {
    id: string;
    key: string;
    title: string;
    status: string;
    projectId: string;
  };
  blockingTask?: {
    id: string;
    key: string;
    title: string;
    status: string;
    projectId: string;
  };
}

export interface CreateTaskDependencyRequest {
  dependentTaskId: string;
  blockingTaskId: string;
  type: DependencyType;
}

export interface TaskHierarchy {
  taskId: string;
  parentId?: string;
  children: TaskHierarchy[];
  depth: number;
  path: string[];
}

export interface TaskRelationship {
  taskId: string;
  relatedTaskId: string;
  relationshipType: 'PARENT' | 'CHILD' | 'BLOCKS' | 'BLOCKED_BY' | 'RELATES_TO';
  description?: string;
}

export interface DependencyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  circularPath?: string[];
}

export interface TaskDependencyFilters {
  taskId?: string;
  projectId?: string;
  type?: DependencyType;
  status?: 'ACTIVE' | 'RESOLVED' | 'ALL';
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  cycles: string[][];
}

export interface DependencyNode {
  taskId: string;
  taskKey: string;
  title: string;
  status: string;
  projectId: string;
  level: number;
  isBlocked: boolean;
  blockedBy: string[];
  blocking: string[];
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: DependencyType;
  weight: number;
}

export interface TaskBlockingInfo {
  taskId: string;
  isBlocked: boolean;
  blockedBy: Array<{
    taskId: string;
    taskKey: string;
    title: string;
    status: string;
    type: DependencyType;
  }>;
  blocking: Array<{
    taskId: string;
    taskKey: string;
    title: string;
    status: string;
    type: DependencyType;
  }>;
  canStart: boolean;
  blockedReason?: string;
}

export interface SubtaskSummary {
  parentTaskId: string;
  totalSubtasks: number;
  completedSubtasks: number;
  inProgressSubtasks: number;
  todoSubtasks: number;
  completionPercentage: number;
  estimatedHours: number;
  loggedHours: number;
  remainingHours: number;
}

export interface TaskTreeNode {
  task: {
    id: string;
    key: string;
    title: string;
    status: string;
    type: string;
    priority?: string;
    assigneeId?: string;
    estimatedHours?: number;
    completionPercentage?: number;
  };
  children: TaskTreeNode[];
  depth: number;
  hasChildren: boolean;
  isExpanded?: boolean;
}

export interface DependencyImpactAnalysis {
  taskId: string;
  impactedTasks: Array<{
    taskId: string;
    taskKey: string;
    title: string;
    impactType: 'DIRECT' | 'INDIRECT';
    impactLevel: number;
    estimatedDelay?: number;
  }>;
  criticalPath: string[];
  totalImpactedTasks: number;
  maxImpactLevel: number;
}

export interface BulkDependencyOperation {
  operation: 'CREATE' | 'DELETE' | 'UPDATE';
  dependencies: Array<{
    dependentTaskId: string;
    blockingTaskId: string;
    type: DependencyType;
  }>;
  validateCircular?: boolean;
}

export interface BulkDependencyResult {
  successful: Array<{
    dependentTaskId: string;
    blockingTaskId: string;
    dependencyId?: string;
  }>;
  failed: Array<{
    dependentTaskId: string;
    blockingTaskId: string;
    error: string;
  }>;
  warnings: string[];
  circularDependencies?: string[][];
}

// Task Linking Types
export interface TaskLink {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  linkType: TaskLinkType;
  description?: string;
  createdBy: string;
  createdAt: Date;
}

export enum TaskLinkType {
  RELATES_TO = 'RELATES_TO',
  DUPLICATES = 'DUPLICATES',
  IS_DUPLICATED_BY = 'IS_DUPLICATED_BY',
  BLOCKS = 'BLOCKS',
  IS_BLOCKED_BY = 'IS_BLOCKED_BY',
  CLONES = 'CLONES',
  IS_CLONED_BY = 'IS_CLONED_BY',
  CAUSES = 'CAUSES',
  IS_CAUSED_BY = 'IS_CAUSED_BY'
}

export interface CreateTaskLinkRequest {
  sourceTaskId: string;
  targetTaskId: string;
  linkType: TaskLinkType;
  description?: string;
}

export interface TaskLinkFilters {
  taskId?: string;
  projectId?: string;
  linkType?: TaskLinkType;
}

// Hierarchy Management Types
export interface MoveTaskRequest {
  taskId: string;
  newParentId?: string;
  position?: number;
}

export interface TaskPositionUpdate {
  taskId: string;
  position: number;
}

export interface HierarchyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  maxDepthExceeded?: boolean;
  circularReference?: boolean;
}

export { DependencyType } from '@prisma/client';