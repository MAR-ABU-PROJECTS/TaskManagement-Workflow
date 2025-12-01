import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { UserRole } from "../types/enums";
import AuditLogService from "../services/AuditLogService";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Audit Logs
 *   description: System activity tracking and audit logs
 */

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Get audit logs with filters
 *     description: |
 *       Retrieve system audit logs with optional filters. Only accessible by SUPER_ADMIN and CEO roles.
 *       Logs include authentication, user management, task operations, and more.
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type (LOGIN, TASK_CREATE, etc.)
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type (User, Task, Project, etc.)
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *         description: Filter by specific entity ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  authenticate,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.CEO),
  async (req, res) => {
    try {
      const {
        userId,
        action,
        entityType,
        entityId,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;

      const result = await AuditLogService.getLogs({
        userId: userId as string | undefined,
        action: action as any,
        entityType: entityType as string | undefined,
        entityId: entityId as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.json(result);
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/audit-logs/user/{userId}:
 *   get:
 *     summary: Get user activity history
 *     description: Retrieve all audit logs for a specific user
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of logs to return
 *     responses:
 *       200:
 *         description: User activity history retrieved
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get(
  "/user/:userId",
  authenticate,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.HOO, UserRole.HR),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;

      const logs = await AuditLogService.getUserActivity(
        userId!,
        limit ? parseInt(limit as string) : undefined
      );

      return res.json({ logs });
    } catch (error: any) {
      console.error("Error fetching user activity:", error);
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/audit-logs/entity/{entityType}/{entityId}:
 *   get:
 *     summary: Get entity history
 *     description: Retrieve all changes made to a specific entity (Task, Project, etc.)
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of entity (Task, Project, etc.)
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity ID
 *     responses:
 *       200:
 *         description: Entity history retrieved
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get("/entity/:entityType/:entityId", authenticate, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const logs = await AuditLogService.getEntityHistory(entityType!, entityId!);

    return res.json({ logs });
  } catch (error: any) {
    console.error("Error fetching entity history:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/audit-logs/recent:
 *   get:
 *     summary: Get recent system activity
 *     description: Retrieve recent audit logs across the entire system
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of recent logs to return
 *     responses:
 *       200:
 *         description: Recent activity retrieved
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get(
  "/recent",
  authenticate,
  requireRoles(UserRole.SUPER_ADMIN, UserRole.CEO),
  async (req, res) => {
    try {
      const { limit } = req.query;

      const logs = await AuditLogService.getRecentActivity(
        limit ? parseInt(limit as string) : undefined
      );

      return res.json({ logs });
    } catch (error: any) {
      console.error("Error fetching recent activity:", error);
      return res.status(500).json({ error: error.message });
    }
  }
);

export default router;
