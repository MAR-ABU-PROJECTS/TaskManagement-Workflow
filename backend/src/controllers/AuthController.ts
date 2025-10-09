import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService';
import { UserModel } from '@/models/UserModel';
import { prisma } from '@/config/database';
import { asyncHandler } from '@/middleware/errorHandler';
import { 
  LoginCredentials, 
  RefreshTokenRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirmRequest 
} from '@/types/user.types';
import { ApiResponse } from '@/types/common.types';
import { logger } from '@/utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    const userModel = new UserModel(prisma);
    this.authService = new AuthService(userModel);
  }

  /**
   * User login
   * POST /api/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const credentials: LoginCredentials = req.body;
    
    const result = await this.authService.login(credentials);
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const response: ApiResponse = {
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
      message: 'Login successful',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * User logout
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (userId) {
      await this.authService.logout(userId, refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const request: RefreshTokenRequest = { refreshToken };
    const result = await this.authService.refreshToken(request);

    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const response: ApiResponse = {
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
      message: 'Token refreshed successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Change password
   * POST /api/auth/change-password
   */
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const request: ChangePasswordRequest = req.body;

    await this.authService.changePassword(userId, request);

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully. Please log in again.',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const request: ResetPasswordRequest = req.body;

    await this.authService.requestPasswordReset(request);

    const response: ApiResponse = {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Confirm password reset
   * POST /api/auth/reset-password
   */
  confirmPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const request: ResetPasswordConfirmRequest = req.body;

    await this.authService.confirmPasswordReset(request);

    const response: ApiResponse = {
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User profile retrieved successfully',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Validate token (for client-side token validation)
   * POST /api/auth/validate
   */
  validateToken = asyncHandler(async (req: Request, res: Response) => {
    // If we reach here, the token is valid (middleware already validated it)
    const user = req.user!;

    const response: ApiResponse = {
      success: true,
      data: {
        valid: true,
        user,
      },
      message: 'Token is valid',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });

  /**
   * Get authentication status
   * GET /api/auth/status
   */
  getAuthStatus = asyncHandler(async (req: Request, res: Response) => {
    const isAuthenticated = !!req.user;
    
    const response: ApiResponse = {
      success: true,
      data: {
        isAuthenticated,
        user: req.user || null,
      },
      message: 'Authentication status retrieved',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
        version: process.env.API_VERSION || 'v1',
      },
    };

    res.status(200).json(response);
  });
}