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
router.get("/projects/:projectId/components", auth_1.authenticate, (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), async (req, res) => {
    try {
        const { projectId } = req.params;
        const components = await prisma_1.default.projectComponent.findMany({
            where: { projectId },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });
        return res.json(components);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/projects/:projectId/components", auth_1.authenticate, (0, rbac_1.hasProjectPermission)(enums_1.Permission.ADMINISTER_PROJECT), async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description, leadId } = req.body;
        if (!projectId) {
            return res.status(400).json({ error: "projectId is required" });
        }
        if (!name) {
            return res.status(400).json({ error: "name is required" });
        }
        const existing = await prisma_1.default.projectComponent.findUnique({
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
                .json({ error: "Component with this name already exists" });
        }
        const component = await prisma_1.default.projectComponent.create({
            data: {
                projectId,
                name,
                description,
                leadId,
            },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
        return res.status(201).json(component);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.get("/components/:id", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const component = await prisma_1.default.projectComponent.findUnique({
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
        if (!component) {
            return res.status(404).json({ error: "Component not found" });
        }
        return res.json(component);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.put("/components/:id", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, leadId } = req.body;
        const component = await prisma_1.default.projectComponent.findUnique({
            where: { id },
            select: { projectId: true },
        });
        if (!component) {
            return res.status(404).json({ error: "Component not found" });
        }
        const hasPermission = await PermissionService_1.default.hasProjectPermission(req.user.id, component.projectId, enums_1.Permission.ADMINISTER_PROJECT);
        if (!hasPermission) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        const updated = await prisma_1.default.projectComponent.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(leadId !== undefined && { leadId }),
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
router.delete("/components/:id", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const component = await prisma_1.default.projectComponent.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
        if (!component) {
            return res.status(404).json({ error: "Component not found" });
        }
        if (component._count.tasks > 0) {
            return res
                .status(400)
                .json({ error: "Cannot delete component with tasks" });
        }
        const hasPermission = await PermissionService_1.default.hasProjectPermission(req.user.id, component.projectId, enums_1.Permission.ADMINISTER_PROJECT);
        if (!hasPermission) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        await prisma_1.default.projectComponent.delete({
            where: { id },
        });
        return res.json({ message: "Component deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
