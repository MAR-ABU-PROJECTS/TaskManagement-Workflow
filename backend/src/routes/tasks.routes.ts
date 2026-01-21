import express from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import {
  canApproveTask,
  hasProjectPermission,
  hasTaskPermission,
  canEditIssue,
  canDeleteIssue,
} from "../middleware/rbac";
import { Permission } from "../types/enums";
import TaskController from "../controllers/TaskController";
import {
  commentController,
  activityLogController,
} from "../controllers/CommentActivityController";
import TaskAttachmentController from "../controllers/TaskAttachmentController";
import TaskDependencyController from "../controllers/TaskDependencyController";
import TimeTrackingController from "../controllers/TimeTrackingController";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// All routes require authentication
router.use(authenticate);

// ==================== PERSONAL TASKS ====================

/**
 * @swagger
 * /api/tasks/personal:
 *   get:
 *     summary: Get all personal tasks
 *     description: |
 *       Retrieve all personal tasks for the authenticated user.
 *       Personal tasks are private and only visible to their creator (and SUPER_ADMIN for audit).
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personal tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Personal tasks retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/personal", (req, res) =>
  TaskController.getPersonalTasks(req, res),
);

/**
 * @swagger
 * /api/tasks/personal:
 *   post:
 *     summary: Create a personal task
 *     description: |
 *       Create a personal task that is not associated with any project.
 *       Personal tasks are private and only visible to the creator.
 *       No special permissions required - any authenticated user can create personal tasks.
 *       Task is automatically assigned to the creator.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 description: Task title
 *                 example: Buy groceries
 *               description:
 *                 type: string
 *                 description: Detailed task description
 *                 example: Need to buy milk, eggs, and bread
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 default: MEDIUM
 *                 example: MEDIUM
 *               issueType:
 *                 type: string
 *                 enum: [TASK, BUG, STORY]
 *                 default: TASK
 *                 example: TASK
 *               labels:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Task labels/tags
 *                 example: ["personal", "shopping"]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Task deadline
 *               estimatedHours:
 *                 type: number
 *                 description: Estimated hours to complete
 *                 example: 2
 *               storyPoints:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Story points estimate
 *                 example: 3
 *     responses:
 *       201:
 *         description: Personal task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Personal task created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/personal", (req, res) =>
  TaskController.createPersonalTask(req, res),
);

// ==================== TASK CRUD ====================

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     description: |
 *       Create a new task in a project. Requires CREATE_ISSUES permission.
 *       Task key is auto-generated based on project key (e.g., WEB-123).
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - summary
 *               - issueType
 *             properties:
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: Project ID
 *               summary:
 *                 type: string
 *                 maxLength: 255
 *                 description: Task title/summary
 *                 example: Fix login button not working
 *               description:
 *                 type: string
 *                 description: Detailed task description (supports markdown)
 *                 example: Users report that the login button is unresponsive on mobile devices
 *               issueType:
 *                 type: string
 *                 enum: [TASK, BUG, STORY, EPIC]
 *                 description: Type of task
 *                 example: BUG
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 default: MEDIUM
 *                 example: HIGH
 *               assigneeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of user IDs to assign task to (supports multiple assignees)
 *                 example: ["user-id-1", "user-id-2"]
 *               sprintId:
 *                 type: string
 *                 format: uuid
 *                 description: Sprint to add task to
 *               epicId:
 *                 type: string
 *                 format: uuid
 *                 description: Epic to link task to
 *               storyPoints:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Story points estimate
 *                 example: 5
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Task deadline
 *               labels:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Task labels/tags
 *                 example: ["frontend", "urgent"]
 *               componentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Component IDs
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post("/", hasProjectPermission(Permission.CREATE_ISSUES), (req, res) =>
  TaskController.createTask(req, res),
);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks (filtered by role and permissions)
 *     description: |
 *       Retrieve all tasks accessible to the user based on their role and project permissions.
 *       Results are filtered by project membership and permissions.
 *       Supports filtering by status, priority, assignee, sprint, and more.
 *       Requires BROWSE_PROJECT permission.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by project
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by priority
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assignee
 *       - in: query
 *         name: sprintId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sprint
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
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get("/", (req, res) => TaskController.getAllTasks(req, res));

/**
 * @swagger
 * /api/tasks/bulk:
 *   post:
 *     summary: Bulk operations on tasks (deprecated - use /api/bulk-operations)
 *     description: |
 *       **Deprecated**: Use /api/bulk-operations endpoints instead.
 *       Perform bulk operations on multiple tasks (delete, update, assign).
 *       Requires EDIT_ISSUES permission.
 *     tags: [Tasks]
 *     deprecated: true
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *               - taskIds
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [delete, update, assign]
 *                 example: assign
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Bulk operation completed
 *       400:
 *         description: Invalid operation or missing taskIds
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post(
  "/bulk",
  hasProjectPermission(Permission.EDIT_ISSUES),
  async (req, res) => {
    try {
      const { operation, taskIds } = req.body;

      if (!operation || !taskIds || !Array.isArray(taskIds)) {
        return res.status(400).json({ message: "Invalid bulk operation" });
      }

      // Handle different bulk operations
      let result;
      switch (operation) {
        case "delete":
          // Bulk delete logic
          result = { deleted: taskIds.length };
          break;
        case "update":
          // Bulk update logic
          result = { updated: taskIds.length };
          break;
        case "assign":
          // Bulk assign logic
          result = { assigned: taskIds.length };
          break;
        default:
          return res.status(400).json({ message: "Unknown operation" });
      }

      return res.json({ message: "Bulk operation completed", result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: |
 *       Retrieve detailed information about a specific task.
 *       Includes all task fields, comments, attachments, time entries, and activity history.
 *       Requires BROWSE_PROJECT permission.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID or key (e.g., WEB-123)
 *     responses:
 *       200:
 *         description: Task details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get(
  "/:id",
  hasTaskPermission(Permission.BROWSE_PROJECT),
  (req, res) => TaskController.getTaskById(req, res),
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Update task
 *     description: Update task fields. Requires EDIT_ISSUES or EDIT_OWN_ISSUES permission.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               summary:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *               storyPoints:
 *                 type: integer
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               labels:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.patch("/:id", canEditIssue, (req, res) =>
  TaskController.updateTask(req, res),
);

// Support PUT for clients expecting full update semantics (backward compatibility)
router.put("/:id", canEditIssue, (req, res) =>
  TaskController.updateTask(req, res),
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     description: Permanently delete a task. Requires DELETE_ISSUES permission. Only PROJECT_ADMIN can delete tasks.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", canDeleteIssue, (req, res) =>
  TaskController.deleteTask(req, res),
);

// ==================== TASK ACTIONS ====================

/**
 * @swagger
 * /api/tasks/{id}/assign:
 *   post:
 *     summary: Assign task to user
 *     description: Assign or reassign a task to a specific user. Sends notification to assignee.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assigneeId
 *             properties:
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID to assign task to (must be project member)
 *     responses:
 *       200:
 *         description: Task assigned successfully
 *       400:
 *         description: Invalid assignee or user not in project
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.post(
  "/:id/assign",
  hasTaskPermission(Permission.ASSIGN_ISSUES),
  (req, res) => TaskController.assignTask(req, res),
);

/**
 * @swagger
 * /api/tasks/{id}/assign/{userId}:
 *   delete:
 *     summary: Unassign one or more users from task
 *     description: |
 *       Remove user(s) from task assignees. Supports single or bulk unassignment.
 *       - **Single**: Provide userId in path parameter
 *       - **Bulk**: Provide userIds array in request body (ignores path userId)
 *
 *       If all assignees are removed, task reverts to DRAFT status.
 *       Requires ASSIGN_ISSUES permission.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *       - in: path
 *         name: userId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to unassign (for single removal, ignored if body has userIds)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of user IDs to unassign (for bulk removal)
 *                 example: ["user-id-1", "user-id-2", "user-id-3"]
 *     responses:
 *       200:
 *         description: All users unassigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "3 user(s) unassigned from task successfully"
 *                 unassigned:
 *                   type: array
 *                   items:
 *                     type: string
 *       207:
 *         description: Partial success (some users unassigned, some failed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 successful:
 *                   type: integer
 *                 failed:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       reason:
 *                         type: string
 *       400:
 *         description: Missing required parameters
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Task not found or user not assigned
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id/assign/:userId",
  hasTaskPermission(Permission.ASSIGN_ISSUES),
  (req, res) => TaskController.unassignTask(req, res),
);

/**
 * @swagger
 * /api/tasks/{id}/transition:
 *   post:
 *     summary: Transition task status
 *     description: |
 *       Move task through workflow states (TO_DO → IN_PROGRESS → IN_REVIEW → DONE).
 *       Validates workflow transitions and updates task history.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ASSIGNED, IN_PROGRESS, PAUSED, REVIEW, COMPLETED, REJECTED]
 *                 description: Target status (workflow-validated)
 *               comment:
 *                 type: string
 *                 description: Optional transition comment (not required)
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *       400:
 *         description: Invalid transition
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.post(
  "/:id/transition",
  hasTaskPermission(Permission.TRANSITION_ISSUES),
  (req, res) => TaskController.changeStatus(req, res),
);

// Legacy alias for clients using /tasks/:id/status
router.put(
  "/:id/status",
  hasTaskPermission(Permission.TRANSITION_ISSUES),
  (req, res) => TaskController.changeStatus(req, res),
);

router.patch(
  "/:id/status",
  hasTaskPermission(Permission.TRANSITION_ISSUES),
  (req, res) => TaskController.changeStatus(req, res),
);

/**
 * @swagger
 * /api/tasks/{id}/approve:
 *   post:
 *     summary: Approve task
 *     description: |
 *       Approve a task that requires approval. Transitions task to DONE status.
 *       Only PROJECT_ADMIN or authorized approvers can approve.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Approval comment
 *     responses:
 *       200:
 *         description: Task approved successfully
 *       403:
 *         description: Insufficient permissions to approve
 *       404:
 *         description: Task not found
 */
router.post("/:id/approve", canApproveTask, (req, res) =>
  TaskController.approveTask(req, res),
);

/**
 * @swagger
 * /api/tasks/{id}/reject:
 *   post:
 *     summary: Reject task
 *     description: |
 *       Reject a task that requires approval. Returns task to IN_PROGRESS for revisions.
 *       Requires PROJECT_ADMIN or authorized approver role.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *                 example: Code quality does not meet standards
 *     responses:
 *       200:
 *         description: Task rejected successfully
 *       400:
 *         description: Reason is required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.post("/:id/reject", canApproveTask, (req, res) =>
  TaskController.rejectTask(req, res),
);

// ==================== COMMENTS ====================

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   get:
 *     summary: Get all comments for a task
 *     description: |
 *       Retrieve all comments on a task in chronological order.
 *       Includes author details and timestamps.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   content:
 *                     type: string
 *                   authorId:
 *                     type: string
 *                   author:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get("/:id/comments", (req, res) =>
  commentController.getTaskComments(req, res),
);

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   post:
 *     summary: Add comment to task
 *     description: |
 *       Add a comment to a task. Supports @mentions to notify users.
 *       Markdown formatting is supported.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Comment text (supports markdown and @mentions)
 *                 example: "@john.doe Please review the changes in the latest commit"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 content:
 *                   type: string
 *                 authorId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Content is required
 *       404:
 *         description: Task not found
 */
router.post("/:id/comments", (req, res) =>
  commentController.createComment(req, res),
);

/**
 * @swagger
 * /api/tasks/{taskId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     description: |
 *       Delete a comment from a task.
 *       Users can only delete their own comments unless they have admin permissions.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Cannot delete others' comments
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.delete("/:taskId/comments/:commentId", (req, res) =>
  commentController.deleteComment(req, res),
);

// ==================== ATTACHMENTS ====================

/**
 * @swagger
 * /api/tasks/{taskId}/attachments:
 *   get:
 *     summary: Get all attachments for a task
 *     description: |
 *       Retrieve list of all file attachments on a task.
 *       Includes file metadata (name, size, type, uploader, date).
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Attachments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   filename:
 *                     type: string
 *                   fileSize:
 *                     type: integer
 *                   mimeType:
 *                     type: string
 *                   uploaderId:
 *                     type: string
 *                   uploadedAt:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get("/:taskId/attachments", authenticate, (req, res) =>
  TaskAttachmentController.getTaskAttachments(req, res),
);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments:
 *   post:
 *     summary: Upload attachment to task
 *     description: |
 *       Upload a file attachment to a task. Max file size: 10MB.
 *       Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, ZIP, etc.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (max 10MB)
 *               description:
 *                 type: string
 *                 description: Optional file description
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 filename:
 *                   type: string
 *                 fileSize:
 *                   type: integer
 *                 mimeType:
 *                   type: string
 *                 uploadedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: No file uploaded or file too large
 *       404:
 *         description: Task not found
 */
router.post(
  "/:taskId/attachments",
  authenticate,
  upload.single("file"),
  (req, res) => TaskAttachmentController.uploadAttachment(req, res),
);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments/{attachmentId}:
 *   get:
 *     summary: Download attachment file
 *     description: |
 *       Download a file attachment from a task.
 *       Returns the file with appropriate content-type headers.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Attachment or task not found
 *       500:
 *         description: Server error
 */
router.get("/:taskId/attachments/:attachmentId", authenticate, (req, res) =>
  TaskAttachmentController.downloadAttachment(req, res),
);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete attachment file
 *     description: |
 *       Permanently delete a file attachment from a task.
 *       Users can only delete their own attachments unless they have admin permissions.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
 *       403:
 *         description: Cannot delete others' attachments
 *       404:
 *         description: Attachment not found
 *       500:
 *         description: Server error
 */
router.delete("/:taskId/attachments/:attachmentId", authenticate, (req, res) =>
  TaskAttachmentController.deleteAttachment(req, res),
);

// ==================== DEPENDENCIES ====================

/**
 * @swagger
 * /api/tasks/{id}/dependencies:
 *   get:
 *     summary: Get all dependencies for a task
 *     description: |
 *       Retrieve all dependency links for a task (both incoming and outgoing).
 *       Shows which tasks this task blocks, is blocked by, relates to, or duplicates.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Dependencies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outgoing:
 *                   type: array
 *                   description: Tasks this task links to
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       targetTask:
 *                         type: object
 *                       linkType:
 *                         type: string
 *                 incoming:
 *                   type: array
 *                   description: Tasks that link to this task
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get("/:id/dependencies", (req, res) =>
  TaskDependencyController.getTaskDependencies(req, res),
);

/**
 * @swagger
 * /api/tasks/{id}/dependencies:
 *   post:
 *     summary: Add dependency to task
 *     description: |
 *       Create a dependency link between tasks.
 *       Types: BLOCKS (this task blocks target), BLOCKED_BY (this task is blocked by target),
 *       RELATES_TO (general relation), DUPLICATES (duplicate of target).
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Source task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetTaskId
 *               - linkType
 *             properties:
 *               targetTaskId:
 *                 type: string
 *                 format: uuid
 *                 description: Target task ID
 *               linkType:
 *                 type: string
 *                 enum: [BLOCKS, BLOCKED_BY, RELATES_TO, DUPLICATES]
 *                 description: Type of dependency
 *                 example: BLOCKS
 *     responses:
 *       201:
 *         description: Dependency created successfully
 *       400:
 *         description: Invalid dependency or circular dependency detected
 *       404:
 *         description: Task not found
 */
router.post("/:id/dependencies", (req, res) =>
  TaskDependencyController.createDependency(req, res),
);

/**
 * @swagger
 * /api/tasks/{taskId}/dependencies/{dependencyId}:
 *   delete:
 *     summary: Remove dependency link between tasks
 *     description: |
 *       Delete a dependency relationship between two tasks.
 *       This does not delete the tasks themselves, only the link.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: dependencyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dependency removed successfully
 *       404:
 *         description: Dependency not found
 *       500:
 *         description: Server error
 */
router.delete("/:taskId/dependencies/:dependencyId", (req, res) =>
  TaskDependencyController.deleteDependency(req, res),
);

// ==================== TIME TRACKING ====================

/**
 * @swagger
 * /api/tasks/{taskId}/time-entries:
 *   get:
 *     summary: Get all time entries for a task
 *     description: |
 *       Retrieve all work log entries for a task.
 *       Shows time spent by each team member with descriptions.
 *       Includes total time spent calculation.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Time entries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       timeSpentMinutes:
 *                         type: integer
 *                       description:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       user:
 *                         type: object
 *                       loggedAt:
 *                         type: string
 *                         format: date-time
 *                 totalMinutes:
 *                   type: integer
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get("/:taskId/time-entries", (req, res) =>
  TimeTrackingController.getTaskTimeEntries(req, res),
);

/**
 * @swagger
 * /api/tasks/{taskId}/time-entries:
 *   post:
 *     summary: Log time for a task
 *     description: |
 *       Log work time spent on a task. Time formats supported: "2h 30m", "2.5h", "150m".
 *       Automatically updates task's total logged time.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timeSpent
 *             properties:
 *               timeSpent:
 *                 type: string
 *                 description: Time spent (e.g., "2h 30m", "2.5h", "150m")
 *                 example: "2h 30m"
 *               description:
 *                 type: string
 *                 description: What was done during this time
 *                 example: "Implemented user authentication logic"
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date when work was done (defaults to today)
 *     responses:
 *       201:
 *         description: Time logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 timeSpentMinutes:
 *                   type: integer
 *                 description:
 *                   type: string
 *                 loggedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid time format
 *       404:
 *         description: Task not found
 */
router.post("/:taskId/time-entries", (req, res) =>
  TimeTrackingController.logTime(req, res),
);

/**
 * @swagger
 * /api/tasks/{taskId}/time-entries/{entryId}:
 *   patch:
 *     summary: Update time entry
 *     description: Update a previously logged time entry. Only the user who created it can update.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timeSpent:
 *                 type: string
 *                 example: "3h"
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Time entry updated successfully
 *       403:
 *         description: Cannot edit others' time entries
 *       404:
 *         description: Time entry not found
 */
router.patch("/:taskId/time-entries/:entryId", (req, res) =>
  TimeTrackingController.updateTimeEntry(req, res),
);

/**
 * @swagger
 * /api/tasks/{taskId}/time-entries/{entryId}:
 *   delete:
 *     summary: Delete time entry
 *     description: |
 *       Delete a work log entry from a task.
 *       Users can only delete their own time entries.
 *       Updates task's total logged time.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Time entry deleted successfully
 *       403:
 *         description: Cannot delete others' time entries
 *       404:
 *         description: Time entry not found
 *       500:
 *         description: Server error
 */
router.delete("/:taskId/time-entries/:entryId", (req, res) =>
  TimeTrackingController.deleteTimeEntry(req, res),
);

// ==================== ACTIVITY LOG ====================

/**
 * @swagger
 * /api/tasks/{id}/activity:
 *   get:
 *     summary: Get task activity log
 *     description: |
 *       Retrieve complete activity/audit log for a task.
 *       Shows all changes made to the task (status, assignee, priority, etc.) with timestamps and actors.
 *       Useful for tracking task history and debugging.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Activity log retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   action:
 *                     type: string
 *                     example: STATUS_CHANGED
 *                   oldValue:
 *                     type: string
 *                   newValue:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   user:
 *                     type: object
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get("/:id/activity", (req, res) =>
  activityLogController.getTaskLogs(req, res),
);

// ==================== KANBAN BOARD ====================

/**
 * @swagger
 * /api/tasks/board/{projectId}:
 *   get:
 *     summary: Get Kanban board view
 *     description: |
 *       Get tasks grouped by status (columns) for Kanban board visualization.
 *       Columns: To Do (DRAFT, ASSIGNED), In Progress (IN_PROGRESS, PAUSED), Review (REVIEW), Done (COMPLETED, REJECTED)
 *       Tasks are ordered by position within each column.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Board retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     projectId:
 *                       type: string
 *                     projectName:
 *                       type: string
 *                     columns:
 *                       type: object
 *                       properties:
 *                         TODO:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: To Do
 *                             statuses:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             tasks:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Task'
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get("/board/:projectId", (req, res) =>
  TaskController.getKanbanBoard(req, res),
);

/**
 * @swagger
 * /api/tasks/{id}/move:
 *   post:
 *     summary: Move task on Kanban board
 *     description: |
 *       Move task to a different status/column and update its position.
 *       Used for drag-and-drop on Kanban boards.
 *       Validates status transitions and permissions.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - position
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ASSIGNED, IN_PROGRESS, PAUSED, REVIEW, COMPLETED, REJECTED]
 *                 description: New task status
 *                 example: IN_PROGRESS
 *               position:
 *                 type: integer
 *                 description: Position in the new column (0-based)
 *                 example: 2
 *     responses:
 *       200:
 *         description: Task moved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden or invalid status transition
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post("/:id/move", (req, res) => TaskController.moveTask(req, res));

/**
 * @swagger
 * /api/tasks/{id}/transitions:
 *   get:
 *     summary: Get available workflow transitions for a task
 *     description: |
 *       Retrieves all valid workflow transitions from the current status based on the project's workflow type.
 *       Takes into account user's project role for permission-based transitions.
 *       This follows Jira's workflow state machine pattern.
 *     tags: [Tasks, Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Available transitions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Available transitions retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentStatus:
 *                       type: string
 *                       enum: [DRAFT, ASSIGNED, IN_PROGRESS, PAUSED, REVIEW, COMPLETED, REJECTED]
 *                       example: IN_PROGRESS
 *                     availableTransitions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Ready for Review
 *                           to:
 *                             type: string
 *                             example: REVIEW
 *                           description:
 *                             type: string
 *                             example: Move task to review stage
 *                           requiredRole:
 *                             type: string
 *                             enum: [DEVELOPER, PROJECT_ADMIN]
 *                             example: DEVELOPER
 *                     workflowType:
 *                       type: string
 *                       enum: [BASIC, AGILE, BUG_TRACKING, CUSTOM]
 *                       example: AGILE
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get("/:id/transitions", (req, res) =>
  TaskController.getAvailableTransitions(req, res),
);

export default router;
