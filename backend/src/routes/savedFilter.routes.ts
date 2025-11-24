import express from "express";
import SavedFilterController from "../controllers/SavedFilterController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/filters:
 *   post:
 *     summary: Create a new saved filter
 *     tags: [Saved Filters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - jql
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Open Issues
 *               description:
 *                 type: string
 *                 example: All my open issues with high priority
 *               jql:
 *                 type: string
 *                 example: assignee = currentUser() AND status != "COMPLETED"
 *               projectId:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Filter created successfully
 *       400:
 *         description: Invalid JQL syntax or missing fields
 */
router.post("/", SavedFilterController.createFilter);

/**
 * @swagger
 * /api/filters:
 *   get:
 *     summary: Get all filters accessible by current user
 *     tags: [Saved Filters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *     responses:
 *       200:
 *         description: List of accessible filters
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   jql:
 *                     type: string
 *                   isPublic:
 *                     type: boolean
 *                   owner:
 *                     type: object
 *                   project:
 *                     type: object
 */
router.get("/", SavedFilterController.getUserFilters);

/**
 * @swagger
 * /api/filters/{id}:
 *   get:
 *     summary: Get filter by ID
 *     tags: [Saved Filters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filter details
 *       403:
 *         description: Access denied
 *       404:
 *         description: Filter not found
 */
router.get("/:id", SavedFilterController.getFilterById);

/**
 * @swagger
 * /api/filters/{id}:
 *   put:
 *     summary: Update a saved filter
 *     tags: [Saved Filters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               jql:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Filter updated successfully
 *       403:
 *         description: Only owner can update
 *       404:
 *         description: Filter not found
 */
router.put("/:id", SavedFilterController.updateFilter);

/**
 * @swagger
 * /api/filters/{id}:
 *   delete:
 *     summary: Delete a saved filter
 *     tags: [Saved Filters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filter deleted successfully
 *       403:
 *         description: Only owner can delete
 *       404:
 *         description: Filter not found
 */
router.delete("/:id", SavedFilterController.deleteFilter);

/**
 * @swagger
 * /api/filters/{id}/share:
 *   post:
 *     summary: Share filter (make public)
 *     tags: [Saved Filters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filter shared successfully
 *       403:
 *         description: Only owner can share
 */
router.post("/:id/share", SavedFilterController.shareFilter);

/**
 * @swagger
 * /api/filters/{id}/clone:
 *   post:
 *     summary: Clone an existing filter
 *     tags: [Saved Filters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for the cloned filter (optional)
 *     responses:
 *       201:
 *         description: Filter cloned successfully
 *       404:
 *         description: Filter not found
 */
router.post("/:id/clone", SavedFilterController.cloneFilter);

export default router;
