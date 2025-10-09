import { Router } from 'express';
import { userAdminRoutes } from '@/controllers/UserAdminController';
import { validate } from '@/validation';
import { acceptInvitationSchema } from '@/validation/admin.validation';

const router = Router();

/**
 * @route   POST /api/public/accept-invitation
 * @desc    Accept user invitation
 * @access  Public
 */
router.post(
  '/accept-invitation',
  validate(acceptInvitationSchema, 'body'),
  ...userAdminRoutes.acceptInvitation
);

/**
 * @route   GET /api/public/invitation/:token
 * @desc    Get invitation details
 * @access  Public
 */
router.get('/invitation/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Mock invitation validation
    // In real implementation, would validate token and return invitation details
    const mockInvitation = {
      email: 'user@example.com',
      role: 'DEVELOPER',
      inviterName: 'Admin User',
      companyName: 'MAR ABU',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isValid: true,
    };

    res.json({
      success: true,
      data: mockInvitation,
      message: 'Invitation details retrieved successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid invitation token',
    });
  }
});

/**
 * @route   GET /api/public/system/status
 * @desc    Get public system status
 * @access  Public
 */
router.get('/system/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'operational',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
    },
    message: 'System is operational',
  });
});

export default router;