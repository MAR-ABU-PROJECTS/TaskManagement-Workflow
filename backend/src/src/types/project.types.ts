import { 
  Project, 
  ProjectMethodology, 
  ProjectStatus, 
  Priority, 
  ProjectMember, 
  ProjectRole,
  Workflow,
  WorkflowStatus,
  WorkflowTransition,
  StatusCategory,
  CustomField,
  CustomFieldType
} from '@prisma/client';
import { IUser } from './user.types';

// Core Project Types
export interface IProject extends Project {
  owner?: IUser;
  members?: IProjectMember[];
  workflows?: IWorkflow[];
  customFields?: ICustomField[];
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface IProjectMember extends ProjectMember {
  user?: IUser;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  key: string;
  methodology: ProjectMethodology;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  priority?: Priority;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  methodology?: ProjectMethodology;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  priority?: Priority;
}

export interface AddProjectMemberRequest {
  userId: string;
  role: ProjectRole;
  permissions: string[];
}

export interface UpdateProjectMemberRequest {
  role?: ProjectRole;
  permissions?: string[];
}

// Workflow Types
export interface IWorkflow extends Workflow {
  statuses?: IWorkflowStatus[];
  transitions?: IWorkflowTransition[];
}

export interface IWorkflowStatus extends WorkflowStatus {
  fromTransitions?: IWorkflowTransition[];
  toTransitions?: IWorkflowTransition[];
}

export interface IWorkflowTransition extends WorkflowTransition {
  fromStatus?: IWorkflowStatus;
  toStatus?: IWorkflowStatus;
}

export interface CreateWorkflowRequest {
  name: string;
  statuses: CreateWorkflowStatusRequest[];
  transitions: CreateWorkflowTransitionRequest[];
}

export interface CreateWorkflowStatusRequest {
  name: string;
  category: StatusCategory;
  order: number;
  color?: string;
}

export interface CreateWorkflowTransitionRequest {
  fromStatusName: string;
  toStatusName: string;
  name: string;
  conditions?: any;
}

export interface UpdateWorkflowRequest {
  name?: string;
  isDefault?: boolean;
}

// Custom Field Types
export interface ICustomField extends CustomField {
  values?: any[];
}

export interface CreateCustomFieldRequest {
  name: string;
  type: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
  order: number;
}

export interface UpdateCustomFieldRequest {
  name?: string;
  type?: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
  order?: number;
}

// Project Query Types
export interface ProjectFilters {
  methodology?: ProjectMethodology;
  status?: ProjectStatus;
  priority?: Priority;
  ownerId?: string;
  search?: string;
}

export interface ProjectListQuery extends ProjectFilters {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'startDate' | 'endDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
  includeCounts?: boolean;
}

// Project Statistics
export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  projectsByMethodology: Record<ProjectMethodology, number>;
  projectsByStatus: Record<ProjectStatus, number>;
  averageProjectDuration: number;
  budgetUtilization: number;
}

// Project Template Types
export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  methodology: ProjectMethodology;
  workflows: CreateWorkflowRequest[];
  customFields: CreateCustomFieldRequest[];
  defaultMembers?: {
    role: ProjectRole;
    permissions: string[];
  }[];
}

export interface CreateProjectFromTemplateRequest {
  templateId: string;
  name: string;
  description?: string;
  key: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  priority?: Priority;
}

// Export enums for convenience
export { 
  ProjectMethodology, 
  ProjectStatus, 
  Priority, 
  ProjectRole,
  StatusCategory,
  CustomFieldType
} from '@prisma/client';