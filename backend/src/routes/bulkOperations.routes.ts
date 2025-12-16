import express from "express";
import BulkOperationsController from "../controllers/BulkOperationsController";
import { authenticate } from "../middleware/auth";
import { hasProjectPermission } from "../middleware/rbac";
import { Permission } from "../types/enums";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/bulk/edit:
 *   post:
 *     summary: Bulk edit multiple tasks
 *     tags: [Bulk Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskIds
 *               - updates
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["task1", "task2", "task3"]
 *               updates:
 *                 type: object
 *                 properties:
 *                   priority:
 *                     type: string
 *                     enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                   assigneeId:
 *                     type: string
 *                   labels:
 *                     type: array
 *                     items:
 *                       type: string
 *                   storyPoints:
 *                     type: integer
 *                   dueDate:
 *                     type: string
 *                     format: date-time
 *                   sprintId:
 *                     type: string
 *                   epicId:
 *                     type: string
 *     responses:
 *       200:
 *         description: Tasks updated successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  "/edit",
  hasProjectPermission(Permission.EDIT_ISSUES),
  BulkOperationsController.bulkEdit
);

/**
 * @swagger
 * /api/bulk/transition:
 *   post:
 *     summary: Bulk transition tasks to new status (with workflow validation)
 *     description: |
 *       Transitions multiple tasks to a new status. Each task is validated individually
 *       against its project's workflow rules. Tasks that fail validation are returned
 *       in the 'failed' array with reasons.
 *     tags: [Bulk Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskIds
 *               - status
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of task IDs to transition
 *                 example: ["task-uuid-1", "task-uuid-2"]
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ASSIGNED, IN_PROGRESS, PAUSED, REVIEW, COMPLETED, REJECTED]
 *                 description: Target status for all tasks
 *                 example: IN_PROGRESS
 *     responses:
 *       200:
 *         description: Bulk transition completed (may include partial failures)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "3 of 5 tasks transitioned to IN_PROGRESS"
 *                 successful:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Task IDs that were successfully transitioned
 *                   example: ["task-1", "task-2", "task-3"]
 *                 failed:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       taskId:
 *                         type: string
 *                       reason:
 *                         type: string
 *                   description: Tasks that failed with reasons
 *                   example: [
 *                     { "taskId": "task-4", "reason": "Invalid transition from DRAFT to COMPLETED in AGILE workflow" },
 *                     { "taskId": "task-5", "reason": "Insufficient permissions" }
 *                   ]
 *                 totalRequested:
 *                   type: integer
 *                   example: 5
 *                 totalSuccessful:
 *                   type: integer
 *                   example: 3
 *                 totalFailed:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/transition",
  hasProjectPermission(Permission.TRANSITION_ISSUES),
  BulkOperationsController.bulkTransition
);

/**
 * @swagger
 * /api/bulk/assign:
 *   post:
 *     summary: Bulk assign tasks to a user
 *     tags: [Bulk Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskIds
 *               - assigneeId
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               assigneeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tasks assigned successfully
 *       404:
 *         description: Assignee not found
 */
router.post(
  "/assign",
  hasProjectPermission(Permission.ASSIGN_ISSUES),
  BulkOperationsController.bulkAssign
);

/**
 * @swagger
 * /api/bulk/delete:
 *   post:
 *     summary: Bulk delete tasks (soft delete)
 *     tags: [Bulk Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskIds
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tasks deleted successfully
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  "/delete",
  hasProjectPermission(Permission.DELETE_ISSUES),
  BulkOperationsController.bulkDelete
);

/**
 * @swagger
 * /api/bulk/move-to-sprint:
 *   post:
 *     summary: Bulk move tasks to sprint or backlog
 *     tags: [Bulk Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskIds
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               sprintId:
 *                 type: string
 *                 nullable: true
 *                 description: Sprint ID or null to move to backlog
 *     responses:
 *       200:
 *         description: Tasks moved successfully
 *       404:
 *         description: Sprint not found
 */
router.post(
  "/move-to-sprint",
  hasProjectPermission(Permission.MANAGE_SPRINTS),
  BulkOperationsController.bulkMoveToSprint
);

/**
 * @swagger
 * /api/bulk/priority:
 *   post:
 *     summary: Bulk update task priority
 *     tags: [Bulk Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskIds
 *               - priority
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *     responses:
 *       200:
 *         description: Priority updated successfully
 */
router.post(
  "/priority",
  hasProjectPermission(Permission.EDIT_ISSUES),
  BulkOperationsController.bulkUpdatePriority
);

export default router;
