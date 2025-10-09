import request from 'supertest';
import app from '../server';
import { PrismaClient } from '@prisma/client';
import { WorkflowType, WorkflowStatus } from '../types/workflow.types';

const prisma = new PrismaClient();

describe('Workflow Management', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;
  let workflowId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'workflow-test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Workflow',
        lastName: 'Tester',
        role: 'ADMIN',
        isActive: true
      }
    });
    userId = user.id;

    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Workflow Project',
        key: 'TWP',
        methodology: 'AGILE',
        status: 'ACTIVE',
        ownerId: userId,
        teamId: 'test-team-id' // This would need to be a real team ID in practice
      }
    });
    projectId = project.id;

    // Mock authentication token
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.workflow.deleteMany({
      where: { createdBy: userId }
    });
    await prisma.project.deleteMany({
      where: { ownerId: userId }
    });
    await prisma.user.deleteMany({
      where: { email: 'workflow-test@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/workflows', () => {
    it('should create a new workflow', async () => {
      const workflowData = {
        name: 'Test Task Workflow',
        description: 'A test workflow for tasks',
        type: WorkflowType.TASK,
        projectId,
        isDefault: true,
        states: [
          {
            name: 'To Do',
            description: 'Tasks that need to be started',
            color: '#gray',
            category: 'TODO',
            isInitial: true,
            isFinal: false,
            position: 1
          },
          {
            name: 'In Progress',
            description: 'Tasks currently being worked on',
            color: '#blue',
            category: 'IN_PROGRESS',
            isInitial: false,
            isFinal: false,
            position: 2
          },
          {
            name: 'Done',
            description: 'Completed tasks',
            color: '#green',
            category: 'DONE',
            isInitial: false,
            isFinal: true,
            position: 3
          }
        ],
        transitions: [
          {
            name: 'Start Work',
            description: 'Begin working on the task',
            fromStateId: 'todo-state-id',
            toStateId: 'inprogress-state-id',
            type: 'MANUAL',
            position: 1
          },
          {
            name: 'Complete',
            description: 'Mark task as completed',
            fromStateId: 'inprogress-state-id',
            toStateId: 'done-state-id',
            type: 'MANUAL',
            position: 2
          }
        ]
      };

      const response = await request(app)
        .post('/api/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(workflowData.name);
      expect(response.body.data.type).toBe(workflowData.type);
      expect(response.body.data.states).toHaveLength(3);
      expect(response.body.data.transitions).toHaveLength(2);

      workflowId = response.body.data.id;
    });

    it('should validate required fields', async () => {
      const invalidWorkflowData = {
        description: 'Missing name and type'
      };

      const response = await request(app)
        .post('/api/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidWorkflowData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Name and type are required');
    });
  });

  describe('GET /api/workflows', () => {
    it('should get workflows with filters', async () => {
      const response = await request(app)
        .get('/api/workflows')
        .query({
          type: WorkflowType.TASK,
          projectId
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should search workflows by name', async () => {
      const response = await request(app)
        .get('/api/workflows')
        .query({
          search: 'Test Task'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toContain('Test Task');
    });
  });

  describe('GET /api/workflows/:workflowId', () => {
    it('should get workflow by ID', async () => {
      const response = await request(app)
        .get(`/api/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(workflowId);
      expect(response.body.data.name).toBe('Test Task Workflow');
    });

    it('should return 404 for non-existent workflow', async () => {
      const nonExistentId = 'non-existent-id';
      const response = await request(app)
        .get(`/api/workflows/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Workflow not found');
    });
  });

  describe('PUT /api/workflows/:workflowId', () => {
    it('should update workflow', async () => {
      const updateData = {
        name: 'Updated Test Workflow',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });
  });

  describe('POST /api/workflows/:workflowId/activate', () => {
    it('should activate workflow', async () => {
      const response = await request(app)
        .post(`/api/workflows/${workflowId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(WorkflowStatus.ACTIVE);
    });
  });

  describe('POST /api/workflows/:workflowId/deactivate', () => {
    it('should deactivate workflow', async () => {
      const response = await request(app)
        .post(`/api/workflows/${workflowId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(WorkflowStatus.INACTIVE);
    });
  });

  describe('POST /api/workflows/:workflowId/clone', () => {
    it('should clone workflow', async () => {
      const cloneData = {
        name: 'Cloned Test Workflow',
        projectId
      };

      const response = await request(app)
        .post(`/api/workflows/${workflowId}/clone`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(cloneData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(cloneData.name);
      expect(response.body.data.id).not.toBe(workflowId);
    });
  });

  describe('GET /api/workflows/:workflowId/stats', () => {
    it('should get workflow statistics', async () => {
      const response = await request(app)
        .get(`/api/workflows/${workflowId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.workflowId).toBe(workflowId);
      expect(response.body.data.totalTasks).toBeDefined();
      expect(response.body.data.stateDistribution).toBeInstanceOf(Array);
    });
  });
});

describe('Project Configuration Management', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;
  let customFieldId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'config-test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Config',
        lastName: 'Tester',
        role: 'ADMIN',
        isActive: true
      }
    });
    userId = user.id;

    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Config Project',
        key: 'TCP',
        methodology: 'AGILE',
        status: 'ACTIVE',
        ownerId: userId,
        teamId: 'test-team-id'
      }
    });
    projectId = project.id;

    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.customField.deleteMany({
      where: { projectId }
    });
    await prisma.projectConfiguration.deleteMany({
      where: { projectId }
    });
    await prisma.project.deleteMany({
      where: { ownerId: userId }
    });
    await prisma.user.deleteMany({
      where: { email: 'config-test@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/projects/:projectId/configuration', () => {
    it('should get or create project configuration', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/configuration`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projectId).toBe(projectId);
      expect(response.body.data.settings).toBeDefined();
      expect(response.body.data.settings.general).toBeDefined();
    });
  });

  describe('PUT /api/projects/:projectId/configuration', () => {
    it('should update project configuration', async () => {
      const configUpdate = {
        general: {
          allowPublicAccess: true,
          enableTimeTracking: false,
          maxAttachmentSize: 20
        },
        notifications: {
          emailNotifications: false,
          inAppNotifications: true
        }
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}/configuration`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(configUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings.general.allowPublicAccess).toBe(true);
      expect(response.body.data.settings.general.enableTimeTracking).toBe(false);
      expect(response.body.data.settings.notifications.emailNotifications).toBe(false);
    });
  });

  describe('POST /api/projects/:projectId/custom-fields', () => {
    it('should create custom field', async () => {
      const fieldData = {
        name: 'Priority Level',
        description: 'Custom priority field',
        type: 'SELECT',
        required: true,
        options: [
          { label: 'Critical', value: 'critical', color: '#red' },
          { label: 'High', value: 'high', color: '#orange' },
          { label: 'Medium', value: 'medium', color: '#yellow' },
          { label: 'Low', value: 'low', color: '#green' }
        ],
        position: 1,
        appliesTo: ['TASK', 'ISSUE']
      };

      const response = await request(app)
        .post(`/api/projects/${projectId}/custom-fields`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(fieldData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(fieldData.name);
      expect(response.body.data.type).toBe(fieldData.type);
      expect(response.body.data.required).toBe(true);

      customFieldId = response.body.data.id;
    });
  });

  describe('GET /api/projects/:projectId/custom-fields', () => {
    it('should get project custom fields', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/custom-fields`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/custom-fields/:fieldId', () => {
    it('should update custom field', async () => {
      const updateData = {
        name: 'Updated Priority Level',
        description: 'Updated description',
        required: false
      };

      const response = await request(app)
        .put(`/api/custom-fields/${customFieldId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.required).toBe(false);
    });
  });
});

describe('Project Templates', () => {
  let authToken: string;
  let userId: string;
  let templateId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'template-test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Template',
        lastName: 'Tester',
        role: 'ADMIN',
        isActive: true
      }
    });
    userId = user.id;

    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.projectTemplate.deleteMany({
      where: { createdBy: userId }
    });
    await prisma.user.deleteMany({
      where: { email: 'template-test@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/project-templates', () => {
    it('should create project template', async () => {
      const templateData = {
        name: 'Agile Development Template',
        description: 'Standard template for agile development projects',
        category: 'Software Development',
        methodology: 'AGILE',
        isPublic: true,
        configuration: {
          general: {
            enableTimeTracking: true,
            requireApprovalForTasks: false
          },
          workflow: {
            allowWorkflowOverride: true
          }
        },
        workflows: [],
        customFields: [],
        defaultRoles: [
          {
            role: 'DEVELOPER',
            permissions: ['READ_TASKS', 'UPDATE_TASKS'],
            isRequired: true
          }
        ],
        sampleTasks: [
          {
            name: 'Setup Development Environment',
            description: 'Configure local development environment',
            type: 'TASK',
            priority: 'HIGH',
            estimatedHours: 4
          }
        ],
        tags: ['agile', 'development', 'standard']
      };

      const response = await request(app)
        .post('/api/project-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(templateData.name);
      expect(response.body.data.category).toBe(templateData.category);
      expect(response.body.data.methodology).toBe(templateData.methodology);

      templateId = response.body.data.id;
    });
  });

  describe('GET /api/project-templates', () => {
    it('should get project templates with filters', async () => {
      const response = await request(app)
        .get('/api/project-templates')
        .query({
          category: 'Software Development',
          methodology: 'AGILE'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  describe('POST /api/projects/clone', () => {
    it('should clone project from template', async () => {
      const cloneData = {
        name: 'Cloned Agile Project',
        key: 'CAP',
        description: 'Project cloned from template',
        templateId,
        includeTeam: false,
        includeTasks: true,
        includeWorkflows: true,
        includeCustomFields: true
      };

      const response = await request(app)
        .post('/api/projects/clone')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cloneData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projectId).toBeDefined();
      expect(response.body.data.clonedItems).toBeDefined();
    });
  });
});