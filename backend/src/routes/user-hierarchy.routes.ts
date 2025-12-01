import express from "express";
import { authenticate } from "../middleware/auth";
import UserHierarchyController from "../controllers/UserHierarchyController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/users/hierarchy:
 *   get:
 *     summary: Get user hierarchy based on current user's permissions
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns users visible to the current user based on their role:
 *       - Super Admin: Sees all users
 *       - CEO: Sees all non-Super Admin users
 *       - HOO/HR: Sees users in their department
 *       - ADMIN/STAFF: Sees only themselves
 *     responses:
 *       200:
 *         description: List of users with hierarchy information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [SUPER_ADMIN, CEO, HOO, HR, ADMIN, STAFF]
 *                       department:
 *                         type: string
 *                         enum: [OPS, HR]
 *                       isSuperAdmin:
 *                         type: boolean
 *                       isActive:
 *                         type: boolean
 *                       promotedAt:
 *                         type: string
 *                         format: date-time
 *                       promotedBy:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/hierarchy", (req, res) =>
  UserHierarchyController.getUserHierarchy(req, res)
);

/**
 * @swagger
 * /api/users/promotable:
 *   get:
 *     summary: Get users that can be promoted by the current user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns users that the current user has authority to promote/demote:
 *       - Super Admin: Can modify anyone except other Super Admins
 *       - CEO: Can modify HOO, HR, ADMIN, STAFF
 *       - HOO: Can modify ADMIN and STAFF in OPS department
 *       - HR: Can modify ADMIN and STAFF in HR department
 *       - ADMIN/STAFF: Cannot modify anyone
 *     responses:
 *       200:
 *         description: List of promotable users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       department:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/promotable", (req, res) =>
  UserHierarchyController.getPromotableUsers(req, res)
);

/**
 * @swagger
 * /api/users/available-roles:
 *   get:
 *     summary: Get roles that the current user can assign
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns the list of roles the current user can promote others to:
 *       - Super Admin: CEO, HOO, HR, ADMIN, STAFF
 *       - CEO: HOO, HR, ADMIN, STAFF
 *       - HOO/HR: ADMIN, STAFF
 *       - ADMIN/STAFF: None
 *     responses:
 *       200:
 *         description: List of available roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [CEO, HOO, HR, ADMIN, STAFF]
 *       401:
 *         description: Unauthorized
 */
router.get("/available-roles", (req, res) =>
  UserHierarchyController.getAvailableRoles(req, res)
);

/**
 * @swagger
 * /api/users/super-admin/verify:
 *   get:
 *     summary: Verify Super Admin count (Super Admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     description: Verifies that exactly 2 Super Admins exist in the system
 *     responses:
 *       200:
 *         description: Super Admin verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 reason:
 *                   type: string
 *       403:
 *         description: Only Super Admins can access this endpoint
 */
router.get("/super-admin/verify", (req, res) =>
  UserHierarchyController.verifySuperAdminCount(req, res)
);

/**
 * @swagger
 * /api/users/{userId}/promote:
 *   post:
 *     summary: Promote a user to a higher role
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to promote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newRole
 *             properties:
 *               newRole:
 *                 type: string
 *                 enum: [CEO, HOO, HR, ADMIN, STAFF]
 *                 description: The role to promote the user to
 *                 example: ADMIN
 *     description: |
 *       Promotion Rules:
 *       - Super Admin can promote to any role (CEO, HOO, HR, ADMIN, STAFF)
 *       - CEO can promote to HOO, HR, ADMIN, STAFF
 *       - HOO can promote STAFF to ADMIN in OPS department
 *       - HR can promote STAFF to ADMIN in HR department
 *       - ADMIN and STAFF cannot promote anyone
 *
 *       Auto-department assignment:
 *       - HOO automatically gets OPS department
 *       - HR automatically gets HR department
 *     responses:
 *       200:
 *         description: User promoted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     department:
 *                       type: string
 *                     promotedAt:
 *                       type: string
 *                       format: date-time
 *                     promotedBy:
 *                       type: object
 *       403:
 *         description: Insufficient permissions to promote user
 *       404:
 *         description: User not found
 */
router.post("/:userId/promote", (req, res) =>
  UserHierarchyController.promoteUser(req, res)
);

/**
 * @swagger
 * /api/users/{userId}/demote:
 *   post:
 *     summary: Demote a user to a lower role
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to demote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newRole
 *             properties:
 *               newRole:
 *                 type: string
 *                 enum: [HOO, HR, ADMIN, STAFF]
 *                 description: The role to demote the user to (must be lower than current)
 *                 example: STAFF
 *     description: |
 *       Demotion Rules (same authority as promotion):
 *       - Super Admin can demote anyone
 *       - CEO can demote HOO, HR, ADMIN to lower roles
 *       - HOO can demote ADMIN to STAFF in OPS department
 *       - HR can demote ADMIN to STAFF in HR department
 *       - ADMIN and STAFF cannot demote anyone
 *
 *       Department reset:
 *       - When demoting from HOO/HR to STAFF, department is cleared
 *     responses:
 *       200:
 *         description: User demoted successfully
 *       403:
 *         description: Insufficient permissions to demote user
 *       404:
 *         description: User not found
 */
router.post("/:userId/demote", (req, res) =>
  UserHierarchyController.demoteUser(req, res)
);

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Remove a user from the system
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to remove
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reassignToUserId:
 *                 type: string
 *                 description: User ID to reassign tasks to (required if user has assigned tasks)
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     description: |
 *       Removal Rules:
 *       - Super Admin can remove anyone (including CEO)
 *       - CEO can remove HOO, HR, ADMIN, STAFF
 *       - HOO can remove ADMIN in OPS department
 *       - HR can remove ADMIN in HR department
 *       - ADMIN and STAFF cannot remove anyone
 *       - Super Admins cannot be removed
 *
 *       Task Reassignment:
 *       - If user has assigned tasks, must provide reassignToUserId
 *       - All created, assigned, and approved tasks will be reassigned
 *     responses:
 *       200:
 *         description: User removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tasksReassigned:
 *                   type: boolean
 *                 taskCount:
 *                   type: number
 *       400:
 *         description: User has tasks that need reassignment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 taskCount:
 *                   type: number
 *                 taskIds:
 *                   type: array
 *                   items:
 *                     type: string
 *       403:
 *         description: Insufficient permissions or trying to remove Super Admin
 *       404:
 *         description: User not found
 */
router.delete("/:userId", (req, res) =>
  UserHierarchyController.removeUser(req, res)
);

export default router;
