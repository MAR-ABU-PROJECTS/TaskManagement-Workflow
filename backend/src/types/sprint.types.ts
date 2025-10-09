import { SprintStatus } from '@prisma/client';

// Sprint Management Types
export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  capacity?: number;
  velocity?: number;
  createdAt: Date;
  updatedAt: Date;
  // Related data
  project?: {
    id: string;
    name: string;
    key: string;
  };
  tasks?: SprintTask[];
  metrics?: SprintMetrics;
}

export interface SprintTask {
  id: string;
  sprintId: string;
  taskId: string;
  addedAt: Date;
  // Related data
  task?: {
    id: string;
    key: string;
    title: string;
    type: string;
    status: string;
    priority?: string;
    assigneeId?: string;
    storyPoints?: number;
    estimatedHours?: number;
    loggedHours: number;
    remainingHours?: number;
  };
}

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  capacity?: number;
}

export interface UpdateSprintRequest {
  name?: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
  status?: SprintStatus;
  capacity?: number;
  velocity?: number;
}

export interface SprintFilters {
  projectId?: string;
  status?: SprintStatus;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  search?: string;
}

export interface SprintQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeTasks?: boolean;
  includeMetrics?: boolean;
}

export interface SprintSearchResult {
  sprints: Sprint[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SprintMetrics {
  sprintId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  totalEstimatedHours: number;
  totalLoggedHours: number;
  totalRemainingHours: number;
  completionPercentage: number;
  velocityPoints: number;
  velocityHours: number;
  burndownData: BurndownPoint[];
  dailyProgress: DailyProgress[];
}

export interface BurndownPoint {
  date: Date;
  remainingStoryPoints: number;
  remainingTasks: number;
  remainingHours: number;
  idealRemaining: number;
  completedStoryPoints: number;
  completedTasks: number;
}

export interface DailyProgress {
  date: Date;
  tasksCompleted: number;
  storyPointsCompleted: number;
  hoursLogged: number;
  tasksAdded: number;
  tasksRemoved: number;
}

export interface SprintCapacityPlanning {
  sprintId: string;
  totalCapacity: number;
  allocatedCapacity: number;
  availableCapacity: number;
  teamMembers: TeamMemberCapacity[];
  recommendations: CapacityRecommendation[];
}

export interface TeamMemberCapacity {
  userId: string;
  userName: string;
  totalCapacity: number;
  allocatedHours: number;
  availableHours: number;
  utilizationPercentage: number;
  assignedTasks: number;
  assignedStoryPoints: number;
}

export interface CapacityRecommendation {
  type: 'OVERALLOCATED' | 'UNDERALLOCATED' | 'BALANCED' | 'RISK';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  userId?: string;
  suggestedAction?: string;
}

export interface SprintPlanning {
  sprintId: string;
  availableTasks: TaskForPlanning[];
  currentTasks: TaskForPlanning[];
  capacity: SprintCapacityPlanning;
  velocity: VelocityData;
  recommendations: PlanningRecommendation[];
}

export interface TaskForPlanning {
  id: string;
  key: string;
  title: string;
  type: string;
  priority?: string;
  storyPoints?: number;
  estimatedHours?: number;
  assigneeId?: string;
  dependencies: string[];
  isBlocked: boolean;
  readyForSprint: boolean;
}

export interface VelocityData {
  projectId: string;
  averageVelocity: number;
  lastSprintVelocity?: number;
  velocityTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  historicalVelocity: Array<{
    sprintId: string;
    sprintName: string;
    velocity: number;
    completedStoryPoints: number;
    sprintDuration: number;
  }>;
}

export interface PlanningRecommendation {
  type: 'CAPACITY' | 'VELOCITY' | 'DEPENDENCY' | 'PRIORITY';
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  taskIds?: string[];
  suggestedAction?: string;
}

export interface SprintRetrospective {
  id: string;
  sprintId: string;
  conductedBy: string;
  conductedAt: Date;
  whatWentWell: string[];
  whatCouldImprove: string[];
  actionItems: ActionItem[];
  teamMood: number; // 1-5 scale
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionItem {
  id: string;
  description: string;
  assigneeId?: string;
  dueDate?: Date;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
  updatedAt: Date;
}

export interface SprintStatistics {
  totalSprints: number;
  activeSprints: number;
  completedSprints: number;
  averageVelocity: number;
  averageSprintDuration: number;
  successRate: number;
  byStatus: Record<string, number>;
  byProject: Record<string, number>;
  velocityTrend: Array<{
    period: string;
    velocity: number;
  }>;
}

export interface SprintValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SprintNotificationEvent {
  type: 'SPRINT_STARTED' | 'SPRINT_COMPLETED' | 'SPRINT_CANCELLED' | 'TASK_ADDED' | 'TASK_REMOVED' | 'CAPACITY_WARNING';
  sprintId: string;
  userId: string;
  data: Record<string, any>;
  recipients: string[];
}

export { SprintStatus } from '@prisma/client';