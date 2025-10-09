import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import { authenticate, optionalAuth, requireActiveUser } from '@/middleware/auth';
import { validate } from '@/validation';
import {
  loginSchema,
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  refreshTokenSchema,
} from '@/validation/user.validation';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema, 'body'),
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post(
  '/logout',
  optionalAuth, // Optional because user might be logging out with expired token
  authController.logout
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires refresh token)
 */
router.post(
  '/refresh',
  // Note: We don't validate refresh token in body because it might come from cookie
  authController.refreshToken
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  requireActiveUser,
  validate(changePasswordSchema, 'body'),
  authController.changePassword
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(resetPasswordRequestSchema, 'body'),
  authController.requestPasswordReset
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Confirm password reset
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(resetPasswordConfirmSchema, 'body'),
  authController.confirmPasswordReset
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  requireActiveUser,
  authController.getCurrentUser
);

/**
 * @route   POST /api/auth/validate
 * @desc    Validate access token
 * @access  Private
 */
router.post(
  '/validate',
  authenticate,
  authController.validateToken
);

/**
 * @route   GET /api/auth/status
 * @desc    Get authentication status
 * @access  Public (optional auth)
 */
router.get(
  '/status',
  optionalAuth,
  authController.getAuthStatus
);

export default router;