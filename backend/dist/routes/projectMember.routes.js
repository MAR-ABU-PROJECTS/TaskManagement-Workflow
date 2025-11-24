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
router.get("/:projectId/members", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), async (req, res) => {
    try {
        const { projectId } = req.params;
        const members = await prisma_1.default.projectMember.findMany({
            where: { projectId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        department: true,
                    },
                },
                addedBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { addedAt: "asc" },
        });
        return res.json(members);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/:projectId/members", (0, rbac_1.requireProjectRole)(enums_1.ProjectRole.PROJECT_ADMIN), async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId, role } = req.body;
        if (!projectId) {
            return res.status(400).json({ error: "projectId is required" });
        }
        if (!userId || !role) {
            return res.status(400).json({ error: "userId and role are required" });
        }
        if (!Object.values(enums_1.ProjectRole).includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const existing = await prisma_1.default.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
        });
        if (existing) {
            return res
                .status(409)
                .json({ error: "User is already a project member" });
        }
        const member = await prisma_1.default.projectMember.create({
            data: {
                projectId,
                userId,
                role,
                addedById: req.user.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return res.status(201).json(member);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.put("/:projectId/members/:memberId", (0, rbac_1.requireProjectRole)(enums_1.ProjectRole.PROJECT_ADMIN), async (req, res) => {
    try {
        const { memberId } = req.params;
        const { role } = req.body;
        if (!role) {
            return res.status(400).json({ error: "role is required" });
        }
        if (!Object.values(enums_1.ProjectRole).includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        const member = await prisma_1.default.projectMember.update({
            where: { id: memberId },
            data: { role },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return res.json(member);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.delete("/:projectId/members/:memberId", (0, rbac_1.requireProjectRole)(enums_1.ProjectRole.PROJECT_ADMIN), async (req, res) => {
    try {
        const { memberId } = req.params;
        await prisma_1.default.projectMember.delete({
            where: { id: memberId },
        });
        return res.json({ message: "Member removed successfully" });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.get("/:projectId/assignable-users", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), async (req, res) => {
    try {
        const { projectId } = req.params;
        const members = await prisma_1.default.projectMember.findMany({
            where: {
                projectId,
                role: {
                    in: [
                        enums_1.ProjectRole.PROJECT_ADMIN,
                        enums_1.ProjectRole.PROJECT_LEAD,
                        enums_1.ProjectRole.DEVELOPER,
                    ],
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        const users = members.map((m) => m.user);
        return res.json(users);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
