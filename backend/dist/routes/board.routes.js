"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const enums_1 = require("../types/enums");
const prisma_1 = __importDefault(require("../db/prisma"));
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get("/:projectId/boards", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), async (req, res) => {
    try {
        const { projectId } = req.params;
        const boards = await prisma_1.default.board.findMany({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/:projectId/boards", (0, rbac_1.requireProjectRole)(enums_1.ProjectRole.PROJECT_LEAD), async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, type, description } = req.body;
        if (!projectId) {
            return res.status(400).json({ error: "projectId is required" });
        }
        if (!name || !type) {
            return res.status(400).json({ error: "name and type are required" });
        }
        if (!Object.values(enums_1.BoardType).includes(type)) {
            return res.status(400).json({ error: "Invalid board type" });
        }
        const board = await prisma_1.default.board.create({
            data: {
                projectId,
                name,
                type,
                description,
            },
        });
        if (type === enums_1.BoardType.KANBAN) {
            await prisma_1.default.boardColumn.createMany({
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
        }
        else if (type === enums_1.BoardType.SCRUM) {
            await prisma_1.default.boardColumn.createMany({
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
        const boardWithColumns = await prisma_1.default.board.findUnique({
            where: { id: board.id },
            include: {
                columns: {
                    orderBy: { position: "asc" },
                },
            },
        });
        return res.status(201).json(boardWithColumns);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.get("/:boardId", auth_1.authenticate, async (req, res) => {
    try {
        const { boardId } = req.params;
        const board = await prisma_1.default.board.findUnique({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/:boardId/columns", auth_1.authenticate, async (req, res) => {
    try {
        const { boardId } = req.params;
        const { name, status, position, wipLimit, mappedStatuses } = req.body;
        if (!boardId) {
            return res.status(400).json({ error: "boardId is required" });
        }
        if (!name || !status) {
            return res.status(400).json({ error: "name and status are required" });
        }
        const column = await prisma_1.default.boardColumn.create({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.put("/columns/:columnId/move-task", auth_1.authenticate, async (req, res) => {
    try {
        const { columnId } = req.params;
        const { taskId, position } = req.body;
        if (!taskId || position === undefined) {
            return res
                .status(400)
                .json({ error: "taskId and position are required" });
        }
        const task = await prisma_1.default.task.update({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
