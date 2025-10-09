import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface WorkflowState {
  id: string;
  name: string;
  description?: string;
  color: string;
  category: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'REVIEW';
  isInitial: boolean;
  isFinal: boolean;
  position: number;
}

export interface WorkflowTransition {
  id: string;
  name: string;
  description?: string;
  fromStateId: string;
  toStateId: string;
  type: 'MANUAL' | 'AUTOMATIC' | 'CONDITIONAL';
  allowedRoles?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  projectId?: string;
  isDefault: boolean;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowService {
  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    try {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId }
      });

      if (!workflow) {
        return null;
      }

      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        type: workflow.type,
        status: workflow.status,
        projectId: workflow.projectId,
        isDefault: workflow.isDefault,
        states: workflow.states as WorkflowState[],
        transitions: workflow.transitions as WorkflowTransition[],
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt
      };
    } catch (error) {
      logger.error('Error getting workflow:', error);
      throw error;
    }
  }

  /**
   * Execute a workflow transition
   */
  async executeTransition(
    workflowId: string,
    transitionId: string,
    entityId: string,
    userId: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Log the transition
      await prisma.workflowTransitionLog.create({
        data: {
          workflowId,
          transitionId,
          entityId,
          entityType: 'TASK',
          userId,
          fromStateId: metadata?.fromStateId || '',
          toStateId: metadata?.toStateId || '',
          executedAt: new Date(),
          metadata
        }
      });

      logger.info(`Workflow transition executed: ${transitionId} for entity ${entityId}`);
    } catch (error) {
      logger.error('Error executing workflow transition:', error);
      throw error;
    }
  }

  /**
   * Get default workflow for a project and type
   */
  async getDefaultWorkflow(projectId?: string, type?: string): Promise<Workflow | null> {
    try {
      const workflow = await prisma.workflow.findFirst({
        where: {
          projectId: projectId || null,
          type: type || 'TASK',
          isDefault: true,
          status: 'ACTIVE'
        }
      });

      if (!workflow) {
        return null;
      }

      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        type: workflow.type,
        status: workflow.status,
        projectId: workflow.projectId,
        isDefault: workflow.isDefault,
        states: workflow.states as WorkflowState[],
        transitions: workflow.transitions as WorkflowTransition[],
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt
      };
    } catch (error) {
      logger.error('Error getting default workflow:', error);
      throw error;
    }
  }
}