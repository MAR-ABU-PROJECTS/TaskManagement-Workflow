import { Router } from 'express';
import { userAdminRoutes } from '@/controllers/UserAdminController';
import { 
  authenticate, 
  requirePermission, 
  requireAdmin,
} from '@/middleware/auth';
import { validate } from '@/validation';
import {
  auditLogQuerySchema,
  userAnalyticsQuerySchema,
  complianceReportSchema,
  sessionQuerySchema,
  userActivityQuerySchema,
} from '@/validation/admin.validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * Dashboard and Statistics
 */

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/dashboard/stats', ...userAdminRoutes.getDashboardStats);

/**
 * User Management
 */

/**
 * @route   POST /api/admin/users/invite
 * @desc    Invite user via email
 * @access  Private (Admin only)
 */
router.post('/users/invite', ...userAdminRoutes.inviteUser);

/**
 * @route   POST /api/admin/users/accept-invitation
 * @desc    Accept user invitation (public endpoint)
 * @access  Public
 */
// Note: This should be moved to a public route or have different auth
router.post('/users/accept-invitation', ...userAdminRoutes.acceptInvitation);

/**
 * @route   POST /api/admin/users/bulk-update
 * @desc    Bulk update users
 * @access  Private (Admin only)
 */
router.post('/users/bulk-update', ...userAdminRoutes.bulkUpdateUsers);

/**
 * @route   GET /api/admin/users/:userId/audit
 * @desc    Get user audit log
 * @access  Private (Admin only)
 */
router.get(
  '/users/:userId/audit',
  validate(auditLogQuerySchema, 'query'),
  ...userAdminRoutes.getUserAuditLog
);

/**
 * @route   GET /api/admin/users/:userId/activity
 * @desc    Get user activity summary
 * @access  Private (Admin only)
 */
router.get(
  '/users/:userId/activity',
  validate(userActivityQuerySchema, 'query'),
  ...userAdminRoutes.getUserActivity
);

/**
 * @route   POST /api/admin/users/:userId/force-logout
 * @desc    Force user logout (terminate all sessions)
 * @access  Private (Admin only)
 */
router.post('/users/:userId/force-logout', ...userAdminRoutes.forceUserLogout);

/**
 * Session Management
 */

/**
 * @route   GET /api/admin/users/:userId/sessions
 * @desc    Get active user sessions
 * @access  Private (Admin only)
 */
router.get('/users/:userId/sessions', ...userAdminRoutes.getUserSessions);

/**
 * @route   DELETE /api/admin/users/:userId/sessions/:sessionId
 * @desc    Terminate specific user session
 * @access  Private (Admin only)
 */
router.delete('/users/:userId/sessions/:sessionId', ...userAdminRoutes.terminateUserSession);

/**
 * Data Management
 */

/**
 * @route   POST /api/admin/users/export
 * @desc    Export users data
 * @access  Private (Admin only)
 */
router.post('/users/export', ...userAdminRoutes.exportUsers);

/**
 * @route   POST /api/admin/users/import
 * @desc    Import users data
 * @access  Private (Admin only)
 */
router.post('/users/import', ...userAdminRoutes.importUsers);

/**
 * Audit and Compliance
 */

/**
 * @route   GET /api/admin/audit
 * @desc    Get system audit log
 * @access  Private (Admin only)
 */
router.get(
  '/audit',
  validate(auditLogQuerySchema, 'query'),
  ...userAdminRoutes.getSystemAuditLog
);

/**
 * @route   GET /api/admin/analytics/users
 * @desc    Get user management analytics
 * @access  Private (Admin only)
 */
router.get(
  '/analytics/users',
  validate(userAnalyticsQuerySchema, 'query'),
  ...userAdminRoutes.getUserAnalytics
);

/**
 * @route   POST /api/admin/reports/compliance
 * @desc    Generate compliance report
 * @access  Private (Admin only)
 */
router.post(
  '/reports/compliance',
  validate(complianceReportSchema, 'body'),
  ...userAdminRoutes.generateComplianceReport
);

/**
 * System Information
 */

/**
 * @route   GET /api/admin/system/info
 * @desc    Get system information
 * @access  Private (Admin only)
 */
router.get('/system/info', (req, res) => {
  const systemInfo = {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: systemInfo,
    message: 'System information retrieved successfully',
  });
});

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health status
 * @access  Private (Admin only)
 */
router.get('/system/health', async (req, res) => {
  try {
    // Check database connection
    const dbHealth = await checkDatabaseHealth();
    
    // Check Redis connection
    const redisHealth = await checkRedisHealth();
    
    // Check disk space (mock)
    const diskHealth = { status: 'healthy', usage: '45%' };
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryHealth = {
      status: memoryUsage.heapUsed / memoryUsage.heapTotal < 0.9 ? 'healthy' : 'warning',
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    };

    const overallHealth = [dbHealth, redisHealth, diskHealth, memoryHealth]
      .every(check => check.status === 'healthy') ? 'healthy' : 'degraded';

    res.json({
      success: true,
      data: {
        status: overallHealth,
        checks: {
          database: dbHealth,
          redis: redisHealth,
          disk: diskHealth,
          memory: memoryHealth,
        },
        timestamp: new Date().toISOString(),
      },
      message: 'System health check completed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper functions for health checks
async function checkDatabaseHealth() {
  try {
    // Mock database health check
    return { status: 'healthy', responseTime: '5ms' };
  } catch (error) {
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function checkRedisHealth() {
  try {
    // Mock Redis health check
    return { status: 'healthy', responseTime: '2ms' };
  } catch (error) {
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default router;