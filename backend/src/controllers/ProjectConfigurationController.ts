import { Request, Response } from 'express';
import { ProjectConfigurationService } from '../services/ProjectConfigurationService';
import { logger } from '../utils/logger';
import {
  ProjectSettings,
  CustomField,
  CustomFieldType,
  CreateProjectTemplateRequest,
  CloneProjectRequest
} from '../types/workflow.types';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError
} from '../middleware/errorHandler';

export class ProjectConfigurationController {
  private configService: ProjectConfigurationService;

  constructor() {
    this.configService = new ProjectConfigurationService();
  }

  /**
   * Get project configuration
   */
  getProjectConfiguration = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AuthorizationError('Authentication required');
      }

      const config = await this.configService.getOrCreateProjectConfiguration(projectId, userId);

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Error getting project configuration:', error);
      throw error;
    }
  };

  /**
   * Update project configuration
   */
  updateProjectConfiguration = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const settings: Partial<ProjectSettings> = req.body;
      const updatedBy = req.user?.id;

      if (!updatedBy) {
        throw new AuthorizationError('Authentication required');
      }

      const config = await this.configService.updateProjectConfiguration(
        projectId,
        settings,
        updatedBy
      );

      res.json({
        success: true,
        data: config,
        message: 'Project configuration updated successfully'
      });
    } catch (error) {
      logger.error('Error updating project configuration:', error);
      throw error;
    }
  };

  /**
   * Create custom field
   */
  createCustomField = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const fieldData: Omit<CustomField, 'id'> = req.body;
      const createdBy = req.user?.id;

      if (!createdBy) {
        throw new AuthorizationError('Authentication required');
      }

      // Validate required fields
      if (!fieldData.name || !fieldData.type) {
        throw new ValidationError('Name and type are required');
      }

      if (!Object.values(CustomFieldType).includes(fieldData.type)) {
        throw new ValidationError('Invalid custom field type');
      }

      const customField = await this.configService.createCustomField(
        projectId,
        fieldData,
        createdBy
      );

      res.status(201).json({
        success: true,
        data: customField,
        message: 'Custom field created successfully'
      });
    } catch (error) {
      logger.error('Error creating custom field:', error);
      throw error;
    }
  };

  /**
   * Update custom field
   */
  updateCustomField = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fieldId } = req.params;
      const updateData: Partial<CustomField> = req.body;
      const updatedBy = req.user?.id;

      if (!updatedBy) {
        throw new AuthorizationError('Authentication required');
      }

      const customField = await this.configService.updateCustomField(
        fieldId,
        updateData,
        updatedBy
      );

      res.json({
        success: true,
        data: customField,
        message: 'Custom field updated successfully'
      });
    } catch (error) {
      logger.error('Error updating custom field:', error);
      throw error;
    }
  };

  /**
   * Delete custom field
   */
  deleteCustomField = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fieldId } = req.params;
      const deletedBy = req.user?.id;

      if (!deletedBy) {
        throw new AuthorizationError('Authentication required');
      }

      await this.configService.deleteCustomField(fieldId, deletedBy);

      res.json({
        success: true,
        message: 'Custom field deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting custom field:', error);
      throw error;
    }
  };

  /**
   * Get project custom fields
   */
  getProjectCustomFields = async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;

      const customFields = await this.configService.getProjectCustomFields(projectId);

      res.json({
        success: true,
        data: customFields,
        count: customFields.length
      });
    } catch (error) {
      logger.error('Error getting project custom fields:', error);
      throw error;
    }
  };

  /**
   * Create project template
   */
  createProjectTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const templateData: CreateProjectTemplateRequest = req.body;
      const createdBy = req.user?.id;

      if (!createdBy) {
        throw new AuthorizationError('Authentication required');
      }

      // Validate required fields
      if (!templateData.name || !templateData.category || !templateData.methodology) {
        throw new ValidationError('Name, category, and methodology are required');
      }

      const template = await this.configService.createProjectTemplate(templateData, createdBy);

      res.status(201).json({
        success: true,
        data: template,
        message: 'Project template created successfully'
      });
    } catch (error) {
      logger.error('Error creating project template:', error);
      throw error;
    }
  };

  /**
   * Get project templates
   */
  getProjectTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        category: req.query.category as string,
        methodology: req.query.methodology as string,
        isPublic: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
        search: req.query.search as string
      };

      const templates = await this.configService.getProjectTemplates(filters);

      res.json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      logger.error('Error getting project templates:', error);
      throw error;
    }
  };

  /**
   * Clone project
   */
  cloneProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const cloneRequest: CloneProjectRequest = req.body;
      const clonedBy = req.user?.id;

      if (!clonedBy) {
        throw new AuthorizationError('Authentication required');
      }

      // Validate required fields
      if (!cloneRequest.name || !cloneRequest.key) {
        throw new ValidationError('Name and key are required');
      }

      if (!cloneRequest.templateId && !cloneRequest.sourceProjectId) {
        throw new ValidationError('Either templateId or sourceProjectId is required');
      }

      const result = await this.configService.cloneProject(cloneRequest, clonedBy);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Project cloned successfully'
      });
    } catch (error) {
      logger.error('Error cloning project:', error);
      throw error;
    }
  };
}