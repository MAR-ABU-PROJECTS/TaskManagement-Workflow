import { Router } from 'express';
import { userRoutes } from '@/controllers/UserController';
import { 
  authenticate, 
  requirePermission, 
  requireAdmin,
  requireResourceOwnership,
} from '@/middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', ...userRoutes.getCurrentUser);

/**
 * @route   PUT /api/users/me/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me/profile', ...userRoutes.updateUserProfile);

/**
 * @route   POST /api/users/me/change-password
 * @desc    Change own password
 * @access  Private
 */
router.post('/me/change-password', ...userRoutes.changeOwnPassword);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats', requireAdmin, ...userRoutes.getUserStats);

/**
 * @route   GET /api/users
 * @desc    Search users with filters and pagination
 * @access  Private (Admin or users with read permission)
 */
router.get('/', requirePermission('users', 'read'), ...userRoutes.searchUsers);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (Admin only)
 */
router.post('/', requirePermission('users', 'create'), ...userRoutes.createUser);

/**
 * @route   GET /api/users/email/:email
 * @desc    Get user by email
 * @access  Private (Admin only)
 */
router.get('/email/:email', requireAdmin, ...userRoutes.getUserByEmail);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or self)
 */
router.get(
  '/:id', 
  requireResourceOwnership((req) => req.params.id),
  ...userRoutes.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  requirePermission('users', 'update'),
  ...userRoutes.updateUser
);

/**
 * @route   POST /api/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (Admin only)
 */
router.post(
  '/:id/deactivate',
  requirePermission('users', 'update'),
  ...userRoutes.deactivateUser
);

/**
 * @route   POST /api/users/:id/reactivate
 * @desc    Reactivate user
 * @access  Private (Admin only)
 */
router.post(
  '/:id/reactivate',
  requirePermission('users', 'update'),
  ...userRoutes.reactivateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (hard delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  requirePermission('users', 'delete'),
  ...userRoutes.deleteUser
);

/**
 * @route   POST /api/users/:id/change-password
 * @desc    Change user password (admin)
 * @access  Private (Admin only)
 */
router.post(
  '/:id/change-password',
  requirePermission('users', 'update'),
  ...userRoutes.changeUserPassword
);

/**
 * @route   POST /api/users/bulk/deactivate
 * @desc    Bulk deactivate users
 * @access  Private (Admin only)
 */
router.post(
  '/bulk/deactivate',
  requirePermission('users', 'update'),
  ...userRoutes.bulkDeactivateUsers
);

/**
 * @route   POST /api/users/bulk/reactivate
 * @desc    Bulk reactivate users
 * @access  Private (Admin only)
 */
router.post(
  '/bulk/reactivate',
  requirePermission('users', 'update'),
  ...userRoutes.bulkReactivateUsers
);

export default router;