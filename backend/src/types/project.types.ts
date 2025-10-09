import { UserRole } from '@prisma/client';

// Project-related enums
export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ProjectPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ProjectMethodology {
  AGILE = 'AGILE',
  SCRUM = 'SCRUM',
  KANBAN = 'KANBAN',
  WATERFALL = 'WATERFALL',
  HYBRID = 'HYBRID',
}

export enum ProjectMemberRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  LEAD = 'LEAD',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum WorkflowStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  TESTING = 'TESTING',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

// Core project interfaces
export interface IProject {
  id: string;
  name: string;
  description?: string;
  key: string; // Unique project key (e.g., "PROJ", "ABC")
  status: ProjectStatus;
  priority: ProjectPriority;
  methodology: ProjectMethodology;
  
  // Dates
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Ownership
  ownerId: string;
  teamId?: string;
  
  // Configuration
  settings: ProjectSettings;
  customFields: Record<string, any>;
  
  // Metadata
  isArchived: boolean;
  isTemplate: boolean;
  templateId?: string;
  
  // Statistics (computed)
  stats?: ProjectStats;
}

export interface ProjectSettings {
  // Workflow configuration
  workflowStatuses: WorkflowStatusConfig[];
  defaultAssignee?: string;
  autoAssignOwner: boolean;
  
  // Permissions
  allowGuestAccess: boolean;
  requireApprovalForChanges: boolean;
  
  // Notifications
  notifyOnTaskCreation: boolean;
  notifyOnStatusChange: boolean;
  notifyOnAssignment: boolean;
  
  // Time tracking
  enableTimeTracking: boolean;
  requireTimeEstimates: boolean;
  
  // Integrations
  gitIntegration?: GitIntegrationConfig;
  slackIntegration?: SlackIntegrationConfig;
  
  // Custom settings
  customSettings: Record<string, any>;
}

export interface WorkflowStatusConfig {
  id: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  isResolved: boolean;
  allowedTransitions: string[];
  permissions: {
    canTransitionTo: UserRole[];
    canEdit: UserRole[];
  };
}

export interface GitIntegrationConfig {
  enabled: boolean;
  repositoryUrl?: string;
  branch?: string;
  webhookSecret?: string;
}

export interface SlackIntegrationConfig {
  enabled: boolean;
  channelId?: string;
  webhookUrl?: string;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalMembers: number;
  activeMembers: number;
  completionPercentage: number;
  averageTaskCompletionTime: number;
  lastActivity: Date;
}

export interface IProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: Date;
  permissions: string[];
  isActive: boolean;
  
  // User details (populated)
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface ITeam {
  id: string;
  name: string;
  description?: string;
  leaderId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Members
  members?: ITeamMember[];
  projects?: IProject[];
}

export interface ITeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  isActive: boolean;
  
  // User details (populated)
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

// Request/Response types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  key?: string; // Auto-generated if not provided
  status?: ProjectStatus;
  priority?: ProjectPriority;
  methodology: ProjectMethodology;
  startDate?: Date;
  endDate?: Date;
  teamId?: string;
  settings?: Partial<ProjectSettings>;
  customFields?: Record<string, any>;
  templateId?: string;
  
  // Initial team members
  members?: Array<{
    userId: string;
    role: ProjectMemberRole;
  }>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  methodology?: ProjectMethodology;
  startDate?: Date;
  endDate?: Date;
  teamId?: string;
  settings?: Partial<ProjectSettings>;
  customFields?: Record<string, any>;
  isArchived?: boolean;
}

export interface ProjectSearchFilters {
  search?: string;
  status?: ProjectStatus[];
  priority?: ProjectPriority[];
  methodology?: ProjectMethodology[];
  ownerId?: string;
  teamId?: string;
  memberUserId?: string;
  isArchived?: boolean;
  isTemplate?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  startDateAfter?: Date;
  startDateBefore?: Date;
  endDateAfter?: Date;
  endDateBefore?: Date;
}

export interface ProjectListResponse {
  projects: IProject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: ProjectSearchFilters;
}

export interface AddProjectMemberRequest {
  userId: string;
  role: ProjectMemberRole;
  permissions?: string[];
}

export interface UpdateProjectMemberRequest {
  role?: ProjectMemberRole;
  permissions?: string[];
  isActive?: boolean;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  leaderId: string;
  members?: Array<{
    userId: string;
    role: string;
  }>;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  leaderId?: string;
  isActive?: boolean;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  methodology: ProjectMethodology;
  settings: ProjectSettings;
  customFields: Record<string, any>;
  
  // Template-specific
  category: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  
  // Predefined structure
  defaultStatuses: WorkflowStatusConfig[];
  defaultRoles: ProjectMemberRole[];
  taskTemplates?: Array<{
    title: string;
    description?: string;
    type: string;
    estimatedHours?: number;
  }>;
}

export interface CreateProjectFromTemplateRequest {
  templateId: string;
  name: string;
  description?: string;
  key?: string;
  startDate?: Date;
  endDate?: Date;
  teamId?: string;
  customizations?: {
    settings?: Partial<ProjectSettings>;
    customFields?: Record<string, any>;
    members?: Array<{
      userId: string;
      role: ProjectMemberRole;
    }>;
  };
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  timestamp: Date;
  
  // User details (populated)
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface ProjectAnalytics {
  projectId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Task metrics
  taskMetrics: {
    created: number;
    completed: number;
    inProgress: number;
    overdue: number;
    averageCompletionTime: number;
    completionRate: number;
  };
  
  // Team metrics
  teamMetrics: {
    totalMembers: number;
    activeMembers: number;
    averageTasksPerMember: number;
    topPerformers: Array<{
      userId: string;
      userName: string;
      tasksCompleted: number;
      hoursLogged: number;
    }>;
  };
  
  // Time metrics
  timeMetrics: {
    totalHoursLogged: number;
    estimatedHours: number;
    averageHoursPerTask: number;
    timeByStatus: Record<string, number>;
  };
  
  // Trend data
  trends: {
    taskCreationTrend: Array<{ date: Date; count: number }>;
    completionTrend: Array<{ date: Date; count: number }>;
    velocityTrend: Array<{ date: Date; velocity: number }>;
  };
}

// Utility types
export type ProjectWithMembers = IProject & {
  members: IProjectMember[];
  team?: ITeam;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type ProjectSummary = Pick<IProject, 
  'id' | 'name' | 'key' | 'status' | 'priority' | 'methodology' | 'createdAt' | 'updatedAt'
> & {
  memberCount: number;
  taskCount: number;
  completionPercentage: number;
};

// Error types
export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project with ID ${projectId} not found`);
    this.name = 'ProjectNotFoundError';
  }
}

export class ProjectKeyConflictError extends Error {
  constructor(key: string) {
    super(`Project key ${key} is already in use`);
    this.name = 'ProjectKeyConflictError';
  }
}

export class ProjectMemberNotFoundError extends Error {
  constructor(projectId: string, userId: string) {
    super(`User ${userId} is not a member of project ${projectId}`);
    this.name = 'ProjectMemberNotFoundError';
  }
}

export class InsufficientProjectPermissionsError extends Error {
  constructor(action: string) {
    super(`Insufficient permissions to ${action}`);
    this.name = 'InsufficientProjectPermissionsError';
  }
}