import { TaskType, Priority } from '@prisma/client';

// Backlog Management Types
export interface Backlog {
  id: string;
  projectId: string;
  priorityOrder: string[];
  createdAt: Date;
  updatedAt: Date;
  // Related data
  project?: {
    id: string;
    name: string;
    key: string;
  };
  items?: BacklogItem[];
}

export interface BacklogItem {
  id: string;
  taskId: string;
  backlogId: string;
  priority: number;
  storyPoints?: number;
  epicId?: string;
  labels: string[];
  estimatedHours?: number;
  businessValue?: number;
  riskLevel: RiskLevel;
  readyForSprint: boolean;
  acceptanceCriteria: string[];
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
  // Related data
  task?: {
    id: string;
    key: string;
    title: string;
    description?: string;
    type: TaskType;
    status: string;
    priority?: Priority;
    assigneeId?: string;
    reporterId: string;
    parentId?: string;
    dueDate?: Date;
    labels: string[];
    components: string[];
    createdAt: Date;
    updatedAt: Date;
  };
  epic?: Epic;
}

export interface Epic {
  id: string;
  key: string;
  title: string;
  description?: string;
  projectId: string;
  status: EpicStatus;
  priority?: Priority;
  ownerId: string;
  startDate?: Date;
  targetDate?: Date;
  businessValue?: number;
  storyPoints?: number;
  progress: number;
  color?: string;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  // Related data
  project?: {
    id: string;
    name: string;
    key: string;
  };
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  stories?: BacklogItem[];
}

export enum EpicStatus {
  DRAFT = 'DRAFT',
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface CreateBacklogItemRequest {
  taskId: string;
  priority?: number;
  storyPoints?: number;
  epicId?: string;
  businessValue?: number;
  riskLevel?: RiskLevel;
  acceptanceCriteria?: string[];
  dependencies?: string[];
}

export interface UpdateBacklogItemRequest {
  priority?: number;
  storyPoints?: number;
  epicId?: string;
  businessValue?: number;
  riskLevel?: RiskLevel;
  readyForSprint?: boolean;
  acceptanceCriteria?: string[];
  dependencies?: string[];
}

export interface CreateEpicRequest {
  title: string;
  description?: string;
  projectId: string;
  priority?: Priority;
  ownerId: string;
  startDate?: Date;
  targetDate?: Date;
  businessValue?: number;
  color?: string;
  labels?: string[];
}

export interface UpdateEpicRequest {
  title?: string;
  description?: string;
  status?: EpicStatus;
  priority?: Priority;
  ownerId?: string;
  startDate?: Date;
  targetDate?: Date;
  businessValue?: number;
  color?: string;
  labels?: string[];
}

export interface BacklogFilters {
  projectId?: string;
  epicId?: string;
  assigneeId?: string;
  status?: string;
  priority?: Priority;
  riskLevel?: RiskLevel;
  readyForSprint?: boolean;
  hasStoryPoints?: boolean;
  labels?: string[];
  search?: string;
}

export interface EpicFilters {
  projectId?: string;
  status?: EpicStatus;
  ownerId?: string;
  priority?: Priority;
  startDateFrom?: Date;
  startDateTo?: Date;
  targetDateFrom?: Date;
  targetDateTo?: Date;
  search?: string;
}

export interface BacklogQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeTask?: boolean;
  includeEpic?: boolean;
}

export interface EpicQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeStories?: boolean;
  includeProgress?: boolean;
}

export interface BacklogSearchResult {
  items: BacklogItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface EpicSearchResult {
  epics: Epic[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PrioritizationRequest {
  itemId: string;
  newPriority: number;
  reason?: string;
}

export interface BulkPrioritizationRequest {
  items: Array<{
    itemId: string;
    priority: number;
  }>;
  reason?: string;
}

export interface BacklogMetrics {
  projectId: string;
  totalItems: number;
  readyItems: number;
  estimatedItems: number;
  totalStoryPoints: number;
  averageStoryPoints: number;
  totalBusinessValue: number;
  averageBusinessValue: number;
  byEpic: Record<string, {
    epicName: string;
    itemCount: number;
    storyPoints: number;
    progress: number;
  }>;
  byRiskLevel: Record<string, number>;
  byStatus: Record<string, number>;
  velocityProjection: VelocityProjection;
}

export interface VelocityProjection {
  averageVelocity: number;
  estimatedSprints: number;
  estimatedCompletionDate?: Date;
  confidenceLevel: number;
  assumptions: string[];
}

export interface StoryMapping {
  epicId: string;
  epicTitle: string;
  userJourneys: UserJourney[];
  totalStoryPoints: number;
  estimatedSprints: number;
}

export interface UserJourney {
  id: string;
  title: string;
  description: string;
  userPersona: string;
  steps: JourneyStep[];
  stories: BacklogItem[];
  priority: number;
}

export interface JourneyStep {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyIds: string[];
}

export interface BacklogRefinement {
  id: string;
  backlogId: string;
  conductedBy: string;
  conductedAt: Date;
  itemsRefined: string[];
  estimationsUpdated: string[];
  criteriaAdded: string[];
  dependenciesIdentified: string[];
  notes?: string;
  nextRefinementDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EstimationSession {
  id: string;
  projectId: string;
  facilitatorId: string;
  participants: string[];
  itemsEstimated: string[];
  estimationMethod: EstimationMethod;
  sessionDate: Date;
  duration: number; // minutes
  consensus: EstimationConsensus[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum EstimationMethod {
  PLANNING_POKER = 'PLANNING_POKER',
  T_SHIRT_SIZING = 'T_SHIRT_SIZING',
  FIBONACCI = 'FIBONACCI',
  LINEAR = 'LINEAR',
  RELATIVE = 'RELATIVE'
}

export interface EstimationConsensus {
  itemId: string;
  finalEstimate: number;
  participantEstimates: Array<{
    userId: string;
    estimate: number;
    confidence: number;
  }>;
  discussionPoints: string[];
  assumptions: string[];
}

export interface BacklogHealth {
  projectId: string;
  healthScore: number;
  readinessScore: number;
  estimationCoverage: number;
  dependencyRisk: number;
  recommendations: HealthRecommendation[];
  lastRefinement?: Date;
  nextRefinementSuggested?: Date;
}

export interface HealthRecommendation {
  type: 'ESTIMATION' | 'REFINEMENT' | 'DEPENDENCY' | 'PRIORITY' | 'ACCEPTANCE_CRITERIA';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  itemIds?: string[];
  suggestedAction: string;
  impact: string;
}

export interface BacklogStatistics {
  totalBacklogs: number;
  totalItems: number;
  averageItemsPerBacklog: number;
  estimationCoverage: number;
  readinessPercentage: number;
  byProject: Record<string, {
    projectName: string;
    itemCount: number;
    storyPoints: number;
    readyItems: number;
  }>;
  byEpic: Record<string, {
    epicName: string;
    itemCount: number;
    storyPoints: number;
    progress: number;
  }>;
  velocityTrends: Array<{
    period: string;
    velocity: number;
    itemsCompleted: number;
  }>;
}

export interface BacklogValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BacklogNotificationEvent {
  type: 'ITEM_ADDED' | 'ITEM_PRIORITIZED' | 'EPIC_CREATED' | 'REFINEMENT_DUE' | 'ESTIMATION_NEEDED';
  backlogId: string;
  userId: string;
  data: Record<string, any>;
  recipients: string[];
}

// UI State Types
export interface BacklogViewState {
  view: 'list' | 'epic' | 'story-map' | 'planning';
  filters: BacklogFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  selectedItems: string[];
  groupBy?: 'epic' | 'priority' | 'status' | 'assignee';
  showCompleted: boolean;
}

export interface EpicViewState {
  view: 'list' | 'roadmap' | 'progress';
  filters: EpicFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  selectedEpics: string[];
  timeframe: 'quarter' | 'year' | 'all';
}

export { TaskType, Priority } from '@prisma/client';