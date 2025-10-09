import { 
  Sprint, 
  SprintStatus, 
  SprintTask, 
  Backlog 
} from '@prisma/client';
import { ITask } from './task.types';
import { IProject } from './project.types';

// Sprint Types
export interface ISprint extends Sprint {
  project?: IProject;
  sprintTasks?: ISprintTask[];
  tasks?: ITask[];
  _count?: {
    tasks: number;
  };
}

export interface ISprintTask extends SprintTask {
  sprint?: ISprint;
  task?: ITask;
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

export interface StartSprintRequest {
  sprintId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CompleteSprintRequest {
  sprintId: string;
  incompleteTasksAction: 'move_to_backlog' | 'move_to_next_sprint';
  nextSprintId?: string;
}

// Sprint Planning Types
export interface SprintPlanningData {
  sprint: ISprint;
  availableTasks: ITask[];
  teamCapacity: number;
  velocityData: VelocityData;
  recommendations: SprintRecommendation[];
}

export interface SprintRecommendation {
  type: 'capacity' | 'velocity' | 'dependency' | 'priority';
  message: string;
  taskIds?: string[];
  severity: 'info' | 'warning' | 'error';
}

export interface AddTaskToSprintRequest {
  sprintId: string;
  taskId: string;
}

export interface RemoveTaskFromSprintRequest {
  sprintId: string;
  taskId: string;
}

// Backlog Types
export interface IBacklog extends Backlog {
  project?: IProject;
  items?: BacklogItem[];
}

export interface BacklogItem {
  task: ITask;
  priority: number;
  epic?: string;
  storyPoints?: number;
  businessValue?: number;
  effort?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface UpdateBacklogRequest {
  priorityOrder: string[];
}

export interface BacklogRefinementRequest {
  taskId: string;
  storyPoints?: number;
  businessValue?: number;
  effort?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  priority?: number;
}

// Velocity and Metrics Types
export interface VelocityData {
  currentVelocity: number;
  averageVelocity: number;
  velocityTrend: VelocityPoint[];
  predictedVelocity: number;
}

export interface VelocityPoint {
  sprintName: string;
  sprintId: string;
  plannedPoints: number;
  completedPoints: number;
  velocity: number;
  startDate: Date;
  endDate: Date;
}

export interface BurndownData {
  sprintId: string;
  totalPoints: number;
  remainingPoints: BurndownPoint[];
  idealBurndown: BurndownPoint[];
}

export interface BurndownPoint {
  date: Date;
  remainingPoints: number;
  completedPoints: number;
  addedPoints?: number;
  removedPoints?: number;
}

// Sprint Metrics
export interface SprintMetrics {
  sprint: ISprint;
  plannedPoints: number;
  completedPoints: number;
  velocity: number;
  burndownData: BurndownData;
  taskBreakdown: {
    completed: number;
    inProgress: number;
    todo: number;
    removed: number;
  };
  scopeChanges: ScopeChange[];
}

export interface ScopeChange {
  date: Date;
  type: 'added' | 'removed';
  taskId: string;
  taskTitle: string;
  storyPoints: number;
  reason?: string;
}

// Sprint Query Types
export interface SprintFilters {
  status?: SprintStatus;
  projectId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
}

export interface SprintListQuery extends SprintFilters {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'startDate' | 'endDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  includeTasks?: boolean;
  includeMetrics?: boolean;
}

// Agile Ceremonies Types
export interface SprintRetrospective {
  sprintId: string;
  whatWentWell: string[];
  whatCouldImprove: string[];
  actionItems: ActionItem[];
  teamMood: number; // 1-5 scale
  notes?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assigneeId?: string;
  dueDate?: Date;
  status: 'open' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface SprintReview {
  sprintId: string;
  demonstratedFeatures: string[];
  stakeholderFeedback: StakeholderFeedback[];
  sprintGoalAchieved: boolean;
  notes?: string;
}

export interface StakeholderFeedback {
  stakeholder: string;
  feedback: string;
  rating: number; // 1-5 scale
  followUpRequired: boolean;
}

// Epic Types
export interface Epic {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  startDate?: Date;
  targetDate?: Date;
  businessValue?: number;
  tasks: ITask[];
  progress: {
    totalTasks: number;
    completedTasks: number;
    totalPoints: number;
    completedPoints: number;
    percentage: number;
  };
}

export interface CreateEpicRequest {
  title: string;
  description?: string;
  projectId: string;
  startDate?: Date;
  targetDate?: Date;
  businessValue?: number;
}

export interface UpdateEpicRequest {
  title?: string;
  description?: string;
  status?: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  startDate?: Date;
  targetDate?: Date;
  businessValue?: number;
}

// Release Planning Types
export interface Release {
  id: string;
  name: string;
  version: string;
  projectId: string;
  startDate: Date;
  releaseDate: Date;
  status: 'planning' | 'in_progress' | 'testing' | 'released' | 'cancelled';
  epics: Epic[];
  features: ITask[];
  releaseNotes?: string;
}

export interface CreateReleaseRequest {
  name: string;
  version: string;
  projectId: string;
  startDate: Date;
  releaseDate: Date;
  epicIds?: string[];
  featureIds?: string[];
}

// Export enums for convenience
export { SprintStatus } from '@prisma/client';