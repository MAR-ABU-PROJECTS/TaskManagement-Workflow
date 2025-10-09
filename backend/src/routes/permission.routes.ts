import { Router } from 'express';
import { permissionRoutes } from '@/controllers/PermissionController';
import { authenticate, requirePermission, requireAdmin } from '@/middleware/auth';

const router = Router();

// All permission routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/permissions/me
 * @desc    Get current user's permissions
 * @access  Private
 */
router.get('/me', ...permissionRoutes.getMyPermissions);

/**
 * @route   GET /api/permissions/users/:userId
 * @desc    Get user permissions
 * @access  Private (Admin or self)
 */
router.get(
  '/users/:userId', 
  requirePermission('users', 'read'),
  ...permissionRoutes.getUserPermissions
);

/**
 * @route   POST /api/permissions/check
 * @desc    Check if user has specific permission
 * @access  Private (Admin only)
 */
router.post(
  '/check',
  requireAdmin,
  ...permissionRoutes.checkPermission
);

/**
 * @route   POST /api/permissions/grant
 * @desc    Grant permission to user
 * @access  Private (Admin only)
 */
router.post(
  '/grant',
  requirePermission('users', 'manage_permissions'),
  ...permissionRoutes.grantPermission
);

/**
 * @route   POST /api/permissions/revoke
 * @desc    Revoke permission from user
 * @access  Private (Admin only)
 */
router.post(
  '/revoke',
  requirePermission('users', 'manage_permissions'),
  ...permissionRoutes.revokePermission
);

/**
 * @route   PUT /api/permissions/users/:userId/role
 * @desc    Change user role
 * @access  Private (Admin only)
 */
router.put(
  '/users/:userId/role',
  requirePermission('users', 'manage_roles'),
  ...permissionRoutes.changeUserRole
);

/**
 * @route   GET /api/permissions/roles/:role
 * @desc    Get permissions for a specific role
 * @access  Private
 */
router.get('/roles/:role', ...permissionRoutes.getRolePermissions);

/**
 * @route   GET /api/permissions/roles
 * @desc    Get all roles and their permissions
 * @access  Private
 */
router.get('/roles', ...permissionRoutes.getAllRoles);

/**
 * @route   POST /api/permissions/bulk-grant
 * @desc    Bulk grant permissions to multiple users
 * @access  Private (Admin only)
 */
router.post(
  '/bulk-grant',
  requirePermission('users', 'manage_permissions'),
  ...permissionRoutes.bulkGrantPermissions
);

/**
 * @route   GET /api/permissions/users-with-permission
 * @desc    Get users with specific permission
 * @access  Private (Admin only)
 */
router.get(
  '/users-with-permission',
  requirePermission('users', 'read'),
  ...permissionRoutes.getUsersWithPermission
);

/**
 * @route   GET /api/permissions/matrix
 * @desc    Get permission matrix for all roles
 * @access  Private
 */
router.get('/matrix', ...permissionRoutes.getPermissionMatrix);

export default router;