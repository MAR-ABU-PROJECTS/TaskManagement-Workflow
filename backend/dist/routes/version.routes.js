"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const enums_1 = require("../types/enums");
const PermissionService_1 = __importDefault(require("../services/PermissionService"));
const prisma_1 = __importDefault(require("../db/prisma"));
const router = (0, express_1.Router)();
router.get("/projects/:projectId/versions", auth_1.authenticate, (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), async (req, res) => {
    try {
        const { projectId } = req.params;
        const { includeArchived } = req.query;
        const versions = await prisma_1.default.projectVersion.findMany({
            where: {
                projectId,
                ...(includeArchived !== "true" && { isArchived: false }),
            },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
            orderBy: [{ isReleased: "asc" }, { releaseDate: "desc" }],
        });
        return res.json(versions);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/projects/:projectId/versions", auth_1.authenticate, (0, rbac_1.hasProjectPermission)(enums_1.Permission.ADMINISTER_PROJECT), async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description, releaseDate } = req.body;
        if (!projectId) {
            return res.status(400).json({ error: "projectId is required" });
        }
        if (!name) {
            return res.status(400).json({ error: "name is required" });
        }
        const existing = await prisma_1.default.projectVersion.findUnique({
            where: {
                projectId_name: {
                    projectId,
                    name,
                },
            },
        });
        if (existing) {
            return res
                .status(409)
                .json({ error: "Version with this name already exists" });
        }
        const version = await prisma_1.default.projectVersion.create({
            data: {
                projectId,
                name,
                description,
                releaseDate: releaseDate ? new Date(releaseDate) : null,
            },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
        return res.status(201).json(version);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.get("/versions/:id", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const version = await prisma_1.default.projectVersion.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        key: true,
                    },
                },
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                    },
                    take: 10,
                },
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
        if (!version) {
            return res.status(404).json({ error: "Version not found" });
        }
        return res.json(version);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.put("/versions/:id", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, releaseDate } = req.body;
        const version = await prisma_1.default.projectVersion.findUnique({
            where: { id },
            select: { projectId: true },
        });
        if (!version) {
            return res.status(404).json({ error: "Version not found" });
        }
        const hasPermission = await PermissionService_1.default.hasProjectPermission(req.user.id, version.projectId, enums_1.Permission.ADMINISTER_PROJECT);
        if (!hasPermission) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        const updated = await prisma_1.default.projectVersion.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(releaseDate !== undefined && {
                    releaseDate: releaseDate ? new Date(releaseDate) : null,
                }),
            },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/versions/:id/release", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const version = await prisma_1.default.projectVersion.findUnique({
            where: { id },
            select: { projectId: true, isReleased: true },
        });
        if (!version) {
            return res.status(404).json({ error: "Version not found" });
        }
        if (version.isReleased) {
            return res.status(400).json({ error: "Version already released" });
        }
        const hasPermission = await PermissionService_1.default.hasProjectPermission(req.user.id, version.projectId, enums_1.Permission.ADMINISTER_PROJECT);
        if (!hasPermission) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        const updated = await prisma_1.default.projectVersion.update({
            where: { id },
            data: {
                isReleased: true,
                releaseDate: new Date(),
            },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/versions/:id/archive", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const version = await prisma_1.default.projectVersion.findUnique({
            where: { id },
            select: { projectId: true },
        });
        if (!version) {
            return res.status(404).json({ error: "Version not found" });
        }
        const hasPermission = await PermissionService_1.default.hasProjectPermission(req.user.id, version.projectId, enums_1.Permission.ADMINISTER_PROJECT);
        if (!hasPermission) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        const updated = await prisma_1.default.projectVersion.update({
            where: { id },
            data: {
                isArchived: true,
            },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/versions/:id/unarchive", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await prisma_1.default.projectVersion.update({
            where: { id },
            data: {
                isArchived: false,
            },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.delete("/versions/:id", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const version = await prisma_1.default.projectVersion.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
        if (!version) {
            return res.status(404).json({ error: "Version not found" });
        }
        if (version._count.tasks > 0) {
            return res
                .status(400)
                .json({ error: "Cannot delete version with tasks" });
        }
        const hasPermission = await PermissionService_1.default.hasProjectPermission(req.user.id, version.projectId, enums_1.Permission.ADMINISTER_PROJECT);
        if (!hasPermission) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        await prisma_1.default.projectVersion.delete({
            where: { id },
        });
        return res.json({ message: "Version deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
