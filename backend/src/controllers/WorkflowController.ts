import { Request, Response } from 'express';
import { WorkflowService } from '../services/WorkflowService';
import { logger } from '../utils/logger';
import {
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  WorkflowFilters,
  WorkflowType,
  WorkflowStatus
} from '../types/workflow.types';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError
} from '../middleware/errorHandler';

export class WorkflowController {
  private workflowService: WorkflowService;

  constructor() {
    this.workflowService = new WorkflowService();
  }

  /**
   * Create a new workflow
   */
  createWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const workflowData: CreateWorkflowRequest = req.body;
      const createdBy = req.user?.id;

      if (!createdBy) {
        throw new AuthorizationError('Authentication required');
      }

      // Validate required fields
      if (!workflowData.name || !workflowData.type) {
        throw new ValidationError('Name and type are required');
      }

      if (!Object.values(WorkflowType).includes(workflowData.type)) {
        throw new ValidationError('Invalid workflow type');
      }

      const workflow = await this.workflowService.createWorkflow(workflowData, createdBy);

      res.status(201).json({
        success: true,
        data: workflow,
        message: 'Workflow created successfully'
      });
    } catch (error) {
      logger.error('Error creating workflow:', error);
      throw error;
    }
  };

  /**
   * Get workflow by ID
   */
  getWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId } = req.params;
      const workflow = await this.workflowService.getWorkflow(workflowId);

      if (!workflow) {
        throw new NotFoundError('Workflow not found');
      }

      res.json({
        success: true,
        data: workflow
      });
    } catch (error) {
      logger.error('Error getting workflow:', error);
      throw error;
    }
  };

  /**
   * Get workflows with filters
   */
  getWorkflows = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      const filters: WorkflowFilters = {};
      if (req.query.type) {
        filters.type = req.query.type as WorkflowType;
      }
      if (req.query.status) {
        filters.status = req.query.status as WorkflowStatus;
      }
      if (req.query.projectId) {
        filters.projectId = req.query.projectId as string;
      }
      if (req.query.isDefault !== undefined) {
        filters.isDefault = req.query.isDefault === 'true';
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const workflows = await this.workflowService.getWorkflows(filters, userId);

      res.json({
        success: true,
        data: workflows,
        count: workflows.length
      });
    } catch (error) {
      logger.error('Error getting workflows:', error);
      throw error;
    }
  };

  /**
   * Update workflow
   */
  updateWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId } = req.params;
      const updateData: UpdateWorkflowRequest = req.body;
      const updatedBy = req.user?.id;

      if (!updatedBy) {
        throw new AuthorizationError('Authentication required');
      }

      const workflow = await this.workflowService.updateWorkflow(
        workflowId,
        updateData,
        updatedBy
      );

      res.json({
        success: true,
        data: workflow,
        message: 'Workflow updated successfully'
      });
    } catch (error) {
      logger.error('Error updating workflow:', error);
      throw error;
    }
  };

  /**
   * Delete workflow
   */
  deleteWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId } = req.params;
      const deletedBy = req.user?.id;

      if (!deletedBy) {
        throw new AuthorizationError('Authentication required');
      }

      await this.workflowService.deleteWorkflow(workflowId, deletedBy);

      res.json({
        success: true,
        message: 'Workflow deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting workflow:', error);
      throw error;
    }
  };

  /**
   * Activate workflow
   */
  activateWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId } = req.params;
      const activatedBy = req.user?.id;

      if (!activatedBy) {
        throw new AuthorizationError('Authentication required');
      }

      const workflow = await this.workflowService.activateWorkflow(workflowId, activatedBy);

      res.json({
        success: true,
        data: workflow,
        message: 'Workflow activated successfully'
      });
    } catch (error) {
      logger.error('Error activating workflow:', error);
      throw error;
    }
  };

  /**
   * Deactivate workflow
   */
  deactivateWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId } = req.params;
      const deactivatedBy = req.user?.id;

      if (!deactivatedBy) {
        throw new AuthorizationError('Authentication required');
      }

      const workflow = await this.workflowService.deactivateWorkflow(workflowId, deactivatedBy);

      res.json({
        success: true,
        data: workflow,
        message: 'Workflow deactivated successfully'
      });
    } catch (error) {
      logger.error('Error deactivating workflow:', error);
      throw error;
    }
  };

  /**
   * Clone workflow
   */
  cloneWorkflow = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId } = req.params;
      const { name, projectId } = req.body;
      const clonedBy = req.user?.id;

      if (!clonedBy) {
        throw new AuthorizationError('Authentication required');
      }

      if (!name) {
        throw new ValidationError('Name is required for cloned workflow');
      }

      const clonedWorkflow = await this.workflowService.cloneWorkflow(
        workflowId,
        name,
        projectId || null,
        clonedBy
      );

      res.status(201).json({
        success: true,
        data: clonedWorkflow,
        message: 'Workflow cloned successfully'
      });
    } catch (error) {
      logger.error('Error cloning workflow:', error);
      throw error;
    }
  };

  /**
   * Get available transitions for a state
   */
  getAvailableTransitions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId, stateId } = req.params;
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      const transitions = await this.workflowService.getAvailableTransitions(
        workflowId,
        stateId,
        userId,
        userRoles
      );

      res.json({
        success: true,
        data: transitions
      });
    } catch (error) {
      logger.error('Error getting available transitions:', error);
      throw error;
    }
  };

  /**
   * Execute workflow transition
   */
  executeTransition = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId, transitionId } = req.params;
      const { entityId, context } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      if (!entityId) {
        throw new ValidationError('Entity ID is required');
      }

      const result = await this.workflowService.executeTransition(
        workflowId,
        transitionId,
        entityId,
        userId,
        context || {}
      );

      res.json({
        success: true,
        data: result,
        message: 'Transition executed successfully'
      });
    } catch (error) {
      logger.error('Error executing workflow transition:', error);
      throw error;
    }
  };

  /**
   * Get workflow statistics
   */
  getWorkflowStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId } = req.params;

      const stats = await this.workflowService.getWorkflowStats(workflowId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting workflow stats:', error);
      throw error;
    }
  };
}