import { Team, TeamMember, TeamRole } from '@prisma/client';
import { IUser } from './user.types';
import { IProject } from './project.types';

// Core Team Types
export interface ITeam extends Team {
  owner?: IUser;
  members?: ITeamMember[];
  projects?: IProject[];
  _count?: {
    members: number;
    projects: number;
  };
}

export interface ITeamMember extends TeamMember {
  user?: IUser;
  team?: ITeam;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  key: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AddTeamMemberRequest {
  userId: string;
  role: TeamRole;
  permissions: string[];
}

export interface UpdateTeamMemberRequest {
  role?: TeamRole;
  permissions?: string[];
}

// Team Query Types
export interface TeamFilters {
  isActive?: boolean;
  ownerId?: string;
  search?: string;
}

export interface TeamListQuery extends TeamFilters {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  includeCounts?: boolean;
}

// Team Statistics
export interface TeamStats {
  totalTeams: number;
  activeTeams: number;
  teamsByRole: Record<TeamRole, number>;
  averageTeamSize: number;
  totalProjects: number;
}

// Team Performance Metrics
export interface TeamPerformance {
  teamId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    tasksCompleted: number;
    issuesResolved: number;
    averageTaskCompletionTime: number;
    averageIssueResolutionTime: number;
    velocity: number;
    burndownEfficiency: number;
  };
  memberPerformance: {
    userId: string;
    tasksCompleted: number;
    issuesResolved: number;
    hoursLogged: number;
    productivity: number;
  }[];
}

// Export enums for convenience
export { TeamRole } from '@prisma/client';