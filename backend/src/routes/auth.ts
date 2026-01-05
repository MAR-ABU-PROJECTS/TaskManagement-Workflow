import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../db/prisma";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token";
import { UserRole } from "../types/enums";
import emailService from "../services/EmailService";
import AuditLogService from "../services/AuditLogService";

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: |
 *       Create a new user account. All new users are automatically assigned the STAFF role.
 *       Role promotions (to ADMIN, HR, HOO, or CEO) must be done by authorized users through the user hierarchy endpoints.
 *
 *       **Role Hierarchy:**
 *       - STAFF (default) → Base level user
 *       - ADMIN → Promoted by HOO, HR, or CEO
 *       - HR/HOO → Promoted by CEO
 *       - CEO → Promoted by Super Admin
 *       - SUPER_ADMIN → Cannot be created via registration (system-level accounts only)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User successfully registered as STAFF with JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Missing required fields (email, password, or name)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing required fields: email, password, name"
 *       409:
 *         description: Email already exists in the system
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Email already exists"
 *       500:
 *         description: Server error during registration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Missing required fields: email, password, name" });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user with STAFF role (default for all new registrations)
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: UserRole.STAFF, // All new users start as STAFF
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    const token = generateToken({ id: newUser.id, role: newUser.role });
    const refreshToken = generateRefreshToken({
      id: newUser.id,
      role: newUser.role,
    });

    // Send welcome email (async, don't await to avoid blocking response)
    emailService
      .sendWelcomeEmail(newUser.email, {
        userName: newUser.name,
        userEmail: newUser.email,
        role: newUser.role,
      })
      .catch((err) => console.error("Failed to send welcome email:", err));

    // Log registration in audit log
    AuditLogService.logAuth({
      userId: newUser.id,
      action: "REGISTER",
      success: true,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
    }).catch((err) => console.error("Failed to log audit:", err));

    return res.status(201).json({
      token,
      refreshToken,
      user: newUser,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: |
 *       Authenticate user and receive JWT token for accessing protected endpoints. Token is valid for 24 hours.
 *       The user's current role is returned in the response.
 *
 *       **User Roles:**
 *       - SUPER_ADMIN → System-level administrator (2 permanent accounts)
 *       - CEO → Organization administrator
 *       - HOO → Head of Operations
 *       - HR → Head of Human Resources
 *       - ADMIN → Project administrator
 *       - STAFF → Base level user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful with JWT token and user details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Email and password are required"
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid credentials"
 *       403:
 *         description: User account is deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Account is deactivated"
 *       500:
 *         description: Server error during login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    // Send login notification email (async, don't await)
    const loginTime = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
    });
    emailService
      .sendLoginNotification(user.email, {
        userName: user.name,
        loginTime,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("user-agent"),
      })
      .catch((err) => console.error("Failed to send login notification:", err));

    // Log login in audit log
    AuditLogService.logAuth({
      userId: user.id,
      action: "LOGIN",
      success: true,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
    }).catch((err) => console.error("Failed to log audit:", err));

    return res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ message: "Login failed", error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: |
 *       Get a new access token using a valid refresh token.
 *       Access tokens expire after 24 hours, refresh tokens expire after 7 days.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token received during login/registration
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: New access token (expires in 24 hours)
 *                 refreshToken:
 *                   type: string
 *                   description: New refresh token (expires in 7 days)
 *       400:
 *         description: Refresh token is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Refresh token is required"
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid or expired refresh token"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "User not found"
 *       500:
 *         description: Server error during token refresh
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Generate new tokens
    const newToken = generateToken({ id: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({
      id: user.id,
      role: user.role,
    });

    // Log token refresh in audit log
    AuditLogService.logAuth({
      userId: user.id,
      action: "TOKEN_REFRESH",
      success: true,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
    }).catch((err) => console.error("Failed to log audit:", err));

    return res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return res
      .status(500)
      .json({ message: "Token refresh failed", error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: |
 *       Logout the current user. This invalidates the current session.
 *       Client should remove stored tokens after calling this endpoint.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       500:
 *         description: Server error during logout
 */
router.post("/logout", async (req, res) => {
  try {
    const userId = req.user?.id;

    // Log logout in audit log
    if (userId) {
      AuditLogService.logAuth({
        userId: userId,
        action: "LOGOUT",
        success: true,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("user-agent"),
      }).catch((err) => console.error("Failed to log audit:", err));
    }

    return res.json({ message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Logout error:", error);
    return res
      .status(500)
      .json({ message: "Logout failed", error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: |
 *       Request a password reset email. A reset token will be sent to the user's email.
 *       The token expires in 1 hour.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent (always returns 200 for security)
 *       400:
 *         description: Email is required
 *       500:
 *         description: Server error
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return res.json({
        message: "If the email exists, a password reset link has been sent",
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Delete any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token (expires in 1 hour)
    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send reset email with the unhashed token
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password?token=${resetToken}`;

    await emailService.sendPasswordResetEmail(user.email, {
      userName: user.name,
      resetUrl,
    });

    // Log password reset request
    AuditLogService.logAuth({
      userId: user.id,
      action: "PASSWORD_RESET_REQUEST",
      success: true,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
    }).catch((err) => console.error("Failed to log audit:", err));

    return res.json({
      message: "If the email exists, a password reset link has been sent",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      message: "Failed to process password reset request",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     description: |
 *       Reset user password using the token received via email.
 *       The token must be valid and not expired.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token from email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: New password (minimum 8 characters)
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token, or missing fields
 *       500:
 *         description: Server error
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    // Hash the token to find it in database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Log password change
    AuditLogService.logAuth({
      userId: resetToken.userId,
      action: "PASSWORD_CHANGE",
      success: true,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
      metadata: { method: "reset_token" },
    }).catch((err) => console.error("Failed to log audit:", err));

    // Send confirmation email
    emailService
      .sendPasswordChangedEmail(resetToken.user.email, {
        userName: resetToken.user.name,
      })
      .catch((err) => console.error("Failed to send confirmation email:", err));

    return res.json({
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      message: "Failed to reset password",
      error: error.message,
    });
  }
});

export default router;
