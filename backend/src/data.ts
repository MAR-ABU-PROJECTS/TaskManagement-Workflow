/*
 * In‑memory data store used for demonstration purposes.
 * In a production system this would be replaced by a proper
 * database (PostgreSQL, Prisma ORM, etc.).
 */
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'TEAM_OWNER' | 'TEAM_ADMIN' | 'PROJECT_MANAGER' | 'MEMBER';
  isActive: boolean;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: Date;
}

export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface TeamMember {
  userId: string;
  role: TeamRole;
}

export interface Project {
  id: string;
  teamId: string;
  name: string;
  key: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignees: string[];
  createdBy: string;
  createdAt: Date;
}

export interface Issue {
  id: string;
  projectId?: string;
  taskId?: string;
  title: string;
  description: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
  createdAt: Date;
}

// In‑memory arrays
export const users: User[] = [];
export const teams: Team[] = [];
export const projects: Project[] = [];
export const tasks: Task[] = [];
export const issues: Issue[] = [];

// Helper functions to create IDs
export function generateId(): string {
  return uuidv4();
}