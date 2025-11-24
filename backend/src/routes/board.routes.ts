import express from "express";
import { authenticate } from "../middleware/auth";
import { hasProjectPermission, requireProjectRole } from "../middleware/rbac";
import { Permission, ProjectRole, BoardType } from "../types/enums";
import prisma from "../db/prisma";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/projects/{projectId}/boards:
 *   get:
 *     summary: Get project boards
 *     description: List all boards (Kanban/Scrum) for a project
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project boards list
 */
router.get(
  "/:projectId/boards",
  hasProjectPermission(Permission.BROWSE_PROJECT),
  async (req, res) => {
    try {
      const { projectId } = req.params;

      const boards = await prisma.board.findMany({
        where: { projectId },
        include: {
          columns: {
            orderBy: { position: "asc" },
          },
          _count: {
            select: { columns: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return res.json(boards);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/boards:
 *   post:
 *     summary: Create new board
 *     description: Create a Kanban or Scrum board for the project. Requires PROJECT_ADMIN or PROJECT_LEAD role.
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [KANBAN, SCRUM]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Board created successfully
 */
router.post(
  "/:projectId/boards",
  requireProjectRole(ProjectRole.PROJECT_LEAD),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { name, type, description } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }

      if (!name || !type) {
        return res.status(400).json({ error: "name and type are required" });
      }

      // Validate type
      if (!Object.values(BoardType).includes(type)) {
        return res.status(400).json({ error: "Invalid board type" });
      }

      const board = await prisma.board.create({
        data: {
          projectId,
          name,
          type,
          description,
        },
      });

      // Create default columns based on board type
      if (type === BoardType.KANBAN) {
        await prisma.boardColumn.createMany({
          data: [
            {
              boardId: board.id,
              name: "To Do",
              status: "TODO",
              position: 0,
              mappedStatuses: ["DRAFT", "ASSIGNED"],
            },
            {
              boardId: board.id,
              name: "In Progress",
              status: "IN_PROGRESS",
              position: 1,
              mappedStatuses: ["IN_PROGRESS"],
            },
            {
              boardId: board.id,
              name: "Done",
              status: "DONE",
              position: 2,
              mappedStatuses: ["COMPLETED"],
            },
          ],
        });
      } else if (type === BoardType.SCRUM) {
        await prisma.boardColumn.createMany({
          data: [
            {
              boardId: board.id,
              name: "To Do",
              status: "TODO",
              position: 0,
              mappedStatuses: ["DRAFT", "ASSIGNED"],
            },
            {
              boardId: board.id,
              name: "In Progress",
              status: "IN_PROGRESS",
              position: 1,
              mappedStatuses: ["IN_PROGRESS"],
            },
            {
              boardId: board.id,
              name: "Review",
              status: "CUSTOM",
              position: 2,
              mappedStatuses: ["REVIEW"],
            },
            {
              boardId: board.id,
              name: "Done",
              status: "DONE",
              position: 3,
              mappedStatuses: ["COMPLETED"],
            },
          ],
        });
      }

      const boardWithColumns = await prisma.board.findUnique({
        where: { id: board.id },
        include: {
          columns: {
            orderBy: { position: "asc" },
          },
        },
      });

      return res.status(201).json(boardWithColumns);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/boards/{boardId}:
 *   get:
 *     summary: Get board with tasks
 *     description: Get board details including all columns and their tasks
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Board details with tasks
 */
router.get("/:boardId", authenticate, async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        project: true,
        columns: {
          orderBy: { position: "asc" },
          include: {
            tasks: {
              orderBy: { position: "asc" },
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                creator: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    return res.json(board);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/boards/{boardId}/columns:
 *   post:
 *     summary: Add column to board
 *     description: Add a new column to the board. Requires PROJECT_ADMIN or PROJECT_LEAD role.
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - status
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE, CUSTOM]
 *               position:
 *                 type: integer
 *               wipLimit:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Column created successfully
 */
router.post("/:boardId/columns", authenticate, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { name, status, position, wipLimit, mappedStatuses } = req.body;

    if (!boardId) {
      return res.status(400).json({ error: "boardId is required" });
    }

    if (!name || !status) {
      return res.status(400).json({ error: "name and status are required" });
    }

    const column = await prisma.boardColumn.create({
      data: {
        boardId,
        name,
        status,
        position: position || 0,
        wipLimit,
        mappedStatuses: mappedStatuses || [],
      },
    });

    return res.status(201).json(column);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/boards/columns/{columnId}/move-task:
 *   put:
 *     summary: Move task to column
 *     description: Move a task to a different column and update its position
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - position
 *             properties:
 *               taskId:
 *                 type: string
 *               position:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Task moved successfully
 */
router.put("/columns/:columnId/move-task", authenticate, async (req, res) => {
  try {
    const { columnId } = req.params;
    const { taskId, position } = req.body;

    if (!taskId || position === undefined) {
      return res
        .status(400)
        .json({ error: "taskId and position are required" });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        boardColumnId: columnId,
        position,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
