import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';
import { TeamRole } from '../types/team.types';

const prisma = new PrismaClient();

describe('Project Team Management', () => {
  let authToken: string;
  let projectId: string;
  let userId: string;
  let adminUserId: string;
  let projectManagerId: string;

  beforeAll(async () => {
    // Create test users
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        passwordHash: 'hashedpassword',
        role: 'ADMIN',
        isActive: true
      }
    });
    adminUserId = adminUser.id;

    const projectManager = await prisma.user.create({
      data: {
        email: 'pm@test.com',
        firstName: 'Project',
        lastName: 'Manager',
        passwordHash: 'hashedpassword',
        role: 'PROJECT_MANAGER',
        isActive: true
      }
    });
    projectManagerId = projectManager.id;

    const testUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hashedpassword',
        role: 'DEVELOPER',
        isActive: true
      }
    });
    userId = testUser.id;

    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        key: 'TEST',
        description: 'Test project for team management',
        methodology: 'AGILE',
        status: 'ACTIVE',
        ownerId: projectManagerId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    projectId = project.id;

    // Get auth token for project manager
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'pm@test.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/projects/:projectId/team/members', () => {
    it('should add a member to project team', async () => {
      const memberData = {
        userId: userId,
        role: TeamRole.DEVELOPER,
        permissions: ['CREATE_TASKS', 'EDIT_ASSIGNED_TASKS', 'LOG_TIME']
      };

      const response = await request(app)
        .post(`/api/projects/${projectId}/team/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(memberData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.role).toBe(TeamRole.DEVELOPER);
      expect(response.body.data.projectId).toBe(projectId);
    });

    it('should not add duplicate member', async () => {
      const memberData = {
        userId: userId,
        role: TeamRole.DEVELOPER
      };

      await request(app)
        .post(`/api/projects/${projectId}/team/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(memberData)
        .expect(400);
    });

    it('should validate required fields', async () => {
      const memberData = {
        role: TeamRole.DEVELOPER
        // Missing userId
      };

      await request(app)
        .post(`/api/projects/${projectId}/team/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(memberData)
        .expect(400);
    });

    it('should validate role enum', async () => {
      const memberData = {
        userId: userId,
        role: 'INVALID_ROLE'
      };

      await request(app)
        .post(`/api/projects/${projectId}/team/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(memberData)
        .expect(400);
    });
  });

  describe('GET /api/projects/:projectId/team/members', () => {
    it('should get all project members', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/team/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter members by role', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/team/members?role=${TeamRole.DEVELOPER}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((member: any) => {
        expect(member.role).toBe(TeamRole.DEVELOPER);
      });
    });

    it('should search members by name', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/team/members?search=Test`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/projects/:projectId/team/members/:userId/role', () => {
    it('should update member role', async () => {
      const updateData = {
        role: TeamRole.TEAM_LEAD,
        permissions: ['CREATE_TASKS', 'EDIT_TASKS', 'ASSIGN_TASKS']
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}/team/members/${userId}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(TeamRole.TEAM_LEAD);
    });

    it('should validate role update', async () => {
      const updateData = {
        role: 'INVALID_ROLE'
      };

      await request(app)
        .put(`/api/projects/${projectId}/team/members/${userId}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('GET /api/projects/:projectId/team/members/:userId', () => {
    it('should get specific member details', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/team/members/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.projectId).toBe(projectId);
    });

    it('should return 404 for non-member', async () => {
      const nonMemberId = 'non-existent-id';
      
      await request(app)
        .get(`/api/projects/${projectId}/team/members/${nonMemberId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/projects/:projectId/team/members/bulk', () => {
    it('should bulk add members', async () => {
      // Create additional test users
      const user2 = await prisma.user.create({
        data: {
          email: 'user2@test.com',
          firstName: 'Test2',
          lastName: 'User2',
          passwordHash: 'hashedpassword',
          role: 'DEVELOPER',
          isActive: true
        }
      });

      const user3 = await prisma.user.create({
        data: {
          email: 'user3@test.com',
          firstName: 'Test3',
          lastName: 'User3',
          passwordHash: 'hashedpassword',
          role: 'TESTER',
          isActive: true
        }
      });

      const bulkData = {
        members: [
          {
            userId: user2.id,
            role: TeamRole.DEVELOPER,
            permissions: ['CREATE_TASKS', 'EDIT_ASSIGNED_TASKS']
          },
          {
            userId: user3.id,
            role: TeamRole.TESTER,
            permissions: ['CREATE_BUGS', 'COMMENT_TASKS']
          }
        ]
      };

      const response = await request(app)
        .post(`/api/projects/${projectId}/team/members/bulk`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.summary.successful).toBe(2);
    });

    it('should validate bulk member data', async () => {
      const bulkData = {
        members: [
          {
            // Missing userId
            role: TeamRole.DEVELOPER
          }
        ]
      };

      await request(app)
        .post(`/api/projects/${projectId}/team/members/bulk`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(400);
    });
  });

  describe('GET /api/projects/team/roles', () => {
    it('should get available project roles', async () => {
      const response = await request(app)
        .get('/api/projects/team/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const roles = response.body.data.map((r: any) => r.role);
      expect(roles).toContain('PROJECT_MANAGER');
      expect(roles).toContain('DEVELOPER');
      expect(roles).toContain('TESTER');
    });
  });

  describe('GET /api/projects/:projectId/team/stats', () => {
    it('should get project team statistics', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/team/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalMembers).toBeGreaterThan(0);
      expect(typeof response.body.data.membersByRole).toBe('object');
      expect(typeof response.body.data.activeMembers).toBe('number');
    });
  });

  describe('DELETE /api/projects/:projectId/team/members/:userId', () => {
    it('should remove member from project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${projectId}/team/members/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should not remove project owner', async () => {
      await request(app)
        .delete(`/api/projects/${projectId}/team/members/${projectManagerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 404 for non-member', async () => {
      const nonMemberId = 'non-existent-id';
      
      await request(app)
        .delete(`/api/projects/${projectId}/team/members/${nonMemberId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Authorization Tests', () => {
    it('should require authentication', async () => {
      await request(app)
        .get(`/api/projects/${projectId}/team/members`)
        .expect(401);
    });

    it('should check project permissions', async () => {
      // Create user without project access
      const unauthorizedUser = await prisma.user.create({
        data: {
          email: 'unauthorized@test.com',
          firstName: 'Unauthorized',
          lastName: 'User',
          passwordHash: 'hashedpassword',
          role: 'DEVELOPER',
          isActive: true
        }
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unauthorized@test.com',
          password: 'password123'
        });

      const unauthorizedToken = loginResponse.body.data.token;

      await request(app)
        .post(`/api/projects/${projectId}/team/members`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send({
          userId: userId,
          role: TeamRole.DEVELOPER
        })
        .expect(403);
    });
  });
});