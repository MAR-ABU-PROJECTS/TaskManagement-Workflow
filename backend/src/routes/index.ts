import { Router } from 'express';
import authRoutes from './auth.routes';
import permissionRoutes from './permission.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import publicRoutes from './public.routes';
import projectRoutes from './project.routes';
import projectTeamRoutes from './project-team.routes';
import taskRoutes from './task.routes';
import taskDependencyRoutes from './taskDependency.routes';
import workflowRoutes from './workflowRoutes';
import { taskCommentRoutes } from './taskCommentRoutes';
import { taskAttachmentRoutes } from './taskAttachmentRoutes';
import { taskActivityRoutes } from './taskActivityRoutes';
import sprintRoutes from './sprint.routes';
import backlogRoutes from './backlog.routes';
// Import other route modules as they are created
// import teamRoutes from './team.routes';
// import issueRoutes from './issue.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.API_VERSION || 'v1',
    },
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MAR ABU Project Management API',
    data: {
      version: process.env.API_VERSION || 'v1',
      documentation: '/api/docs',
      endpoints: {
        auth: '/api/auth',
        permissions: '/api/permissions',
        users: '/api/users',
        admin: '/api/admin',
        public: '/api/public',
        projects: '/api/projects',
        teams: '/api/teams',
        tasks: '/api/tasks',
        taskDependencies: '/api/task-dependencies',
        taskComments: '/api/comments',
        taskAttachments: '/api/attachments',
        taskActivity: '/api/activity',
        sprints: '/api/sprints',
        backlog: '/api/backlog',
        epics: '/api/epics',
        issues: '/api/issues',
        workflows: '/api/workflows',
      },
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/permissions', permissionRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);
router.use('/projects', projectRoutes);
router.use('/projects', projectTeamRoutes);
router.use('/tasks', taskRoutes);
router.use('/task-dependencies', taskDependencyRoutes);
router.use('/', workflowRoutes); // Workflows and project configuration routes
router.use('/', taskCommentRoutes); // Task comment routes
router.use('/', taskAttachmentRoutes); // Task attachment routes
router.use('/', taskActivityRoutes); // Task activity routes
router.use('/sprints', sprintRoutes); // Sprint routes
router.use('/', backlogRoutes); // Backlog and epic routes
// router.use('/teams', teamRoutes);
// router.use('/issues', issueRoutes);

export default router;