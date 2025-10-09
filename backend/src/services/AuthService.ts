import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { UserModel } from '@/models/UserModel';
import { CacheService } from '@/config/redis';
import { logger } from '@/utils/logger';
import { 
  LoginCredentials, 
  AuthResult, 
  RefreshTokenRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirmRequest,
  IUser 
} from '@/types/user.types';
import { 
  AuthenticationError, 
  ValidationError, 
  NotFoundError 
} from '@/middleware/errorHandler';

export class AuthService {
  private userModel: UserModel;
  private cache: CacheService;
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private jwtExpiresIn: string;
  private jwtRefreshExpiresIn: string;

  constructor(userModel: UserModel) {
    this.userModel = userModel;
    this.cache = CacheService.getInstance();
    this.jwtSecret = process.env.JWT_SECRET!;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials;

      // Verify user credentials
      const user = await this.userModel.verifyPassword(email, password);
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Store refresh token in cache
      await this.storeRefreshToken(user.id, refreshToken);

      // Remove password hash from user object
      const { passwordHash, ...userWithoutPassword } = user;

      logger.info(`User logged in: ${user.email}`);

      return {
        user: userWithoutPassword as IUser,
        accessToken,
        refreshToken,
        expiresIn: this.jwtExpiresIn,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    try {
      // Remove refresh token from cache
      if (refreshToken) {
        await this.revokeRefreshToken(userId, refreshToken);
      }

      // Remove all user sessions (optional - for complete logout from all devices)
      await this.cache.del(`refresh_tokens:${userId}:*`);

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async refreshToken(request: RefreshTokenRequest): Promise<AuthResult> {
    try {
      const { refreshToken } = request;

      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);
      const userId = decoded.userId;

      // Check if refresh token exists in cache
      const storedToken = await this.cache.get(`refresh_tokens:${userId}:${refreshToken}`);
      if (!storedToken) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Get user
      const user = await this.userModel.findById(userId);
      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user as User);

      // Store new refresh token and remove old one
      await this.storeRefreshToken(userId, tokens.refreshToken);
      await this.cache.del(`refresh_tokens:${userId}:${refreshToken}`);

      logger.info(`Token refreshed for user: ${userId}`);

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.jwtExpiresIn,
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw error;
    }
  }

  async changePassword(userId: string, request: ChangePasswordRequest): Promise<void> {
    try {
      const { currentPassword, newPassword } = request;

      // Get user with password hash
      const user = await this.userModel.findByEmail(
        (await this.userModel.findById(userId))?.email || ''
      );
      
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Current password is incorrect');
      }

      // Change password
      await this.userModel.changePassword(userId, newPassword);

      // Revoke all refresh tokens to force re-login
      await this.revokeAllUserTokens(userId);

      logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  async requestPasswordReset(request: ResetPasswordRequest): Promise<void> {
    try {
      const { email } = request;

      const user = await this.userModel.findByEmail(email);
      if (!user || !user.isActive) {
        // Don't reveal if user exists for security
        logger.warn(`Password reset requested for non-existent user: ${email}`);
        return;
      }

      // Generate reset token
      const resetToken = this.generateResetToken(user.id);

      // Store reset token in cache (expires in 1 hour)
      await this.cache.set(`password_reset:${resetToken}`, user.id, 3600);

      // TODO: Send email with reset token
      // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

      logger.info(`Password reset requested for user: ${email}`);
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  async confirmPasswordReset(request: ResetPasswordConfirmRequest): Promise<void> {
    try {
      const { token, newPassword } = request;

      // Verify reset token
      const userId = await this.cache.get(`password_reset:${token}`);
      if (!userId) {
        throw new ValidationError('Invalid or expired reset token');
      }

      // Change password
      await this.userModel.changePassword(userId, newPassword);

      // Remove reset token
      await this.cache.del(`password_reset:${token}`);

      // Revoke all refresh tokens
      await this.revokeAllUserTokens(userId);

      logger.info(`Password reset completed for user: ${userId}`);
    } catch (error) {
      logger.error('Password reset confirmation error:', error);
      throw error;
    }
  }

  async validateAccessToken(token: string): Promise<IUser> {
    try {
      const decoded = this.verifyAccessToken(token);
      const userId = decoded.userId;

      // Get user from cache or database
      const user = await this.userModel.findById(userId);
      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid access token');
      }
      throw error;
    }
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'mar-abu-pm',
      audience: 'mar-abu-pm-client',
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.jwtRefreshSecret,
      {
        expiresIn: this.jwtRefreshExpiresIn,
        issuer: 'mar-abu-pm',
        audience: 'mar-abu-pm-client',
      }
    );

    return { accessToken, refreshToken };
  }

  private verifyAccessToken(token: string): any {
    return jwt.verify(token, this.jwtSecret, {
      issuer: 'mar-abu-pm',
      audience: 'mar-abu-pm-client',
    });
  }

  private verifyRefreshToken(token: string): any {
    return jwt.verify(token, this.jwtRefreshSecret, {
      issuer: 'mar-abu-pm',
      audience: 'mar-abu-pm-client',
    });
  }

  private generateResetToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'password_reset' },
      this.jwtSecret,
      { expiresIn: '1h' }
    );
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const key = `refresh_tokens:${userId}:${refreshToken}`;
    const expiresIn = this.parseTimeToSeconds(this.jwtRefreshExpiresIn);
    await this.cache.set(key, { userId, createdAt: new Date() }, expiresIn);
  }

  private async revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const key = `refresh_tokens:${userId}:${refreshToken}`;
    await this.cache.del(key);
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    // In a real implementation, you'd use Redis SCAN to find and delete all matching keys
    // For now, we'll use a simple pattern
    await this.cache.del(`refresh_tokens:${userId}:*`);
  }

  private parseTimeToSeconds(timeString: string): number {
    const unit = timeString.slice(-1);
    const value = parseInt(timeString.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 3600; // Default to 1 hour
    }
  }
}