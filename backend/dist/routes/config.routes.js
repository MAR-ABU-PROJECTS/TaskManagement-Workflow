"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const enums_1 = require("../types/enums");
const WorkflowService_1 = __importDefault(require("../services/WorkflowService"));
const PermissionSchemeService_1 = __importDefault(require("../services/PermissionSchemeService"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get("/workflows", async (_req, res) => {
    try {
        const schemes = await WorkflowService_1.default.getAllWorkflowSchemes();
        return res.json(schemes);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/workflows", (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { name, description, isDefault } = req.body;
        if (!name) {
            return res.status(400).json({ error: "name is required" });
        }
        const scheme = await WorkflowService_1.default.createWorkflowScheme({
            name,
            description,
            isDefault,
        });
        return res.status(201).json(scheme);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.get("/workflows/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Workflow scheme ID is required" });
        }
        const scheme = await WorkflowService_1.default.getWorkflowSchemeById(id);
        if (!scheme) {
            return res.status(404).json({ error: "Workflow scheme not found" });
        }
        return res.json(scheme);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.patch("/workflows/:id", (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Workflow scheme ID is required" });
        }
        const updates = req.body;
        const scheme = await WorkflowService_1.default.updateWorkflowScheme(id, updates);
        return res.json(scheme);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.delete("/workflows/:id", (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Workflow scheme ID is required" });
        }
        await WorkflowService_1.default.deleteWorkflowScheme(id);
        return res.json({ message: "Workflow scheme deleted" });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.get("/permissions", async (_req, res) => {
    try {
        const schemes = await PermissionSchemeService_1.default.getAllPermissionSchemes();
        return res.json(schemes);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/permissions", (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { name, description, isDefault } = req.body;
        if (!name) {
            return res.status(400).json({ error: "name is required" });
        }
        const scheme = await PermissionSchemeService_1.default.createPermissionScheme({
            name,
            description,
            isDefault,
        });
        return res.status(201).json(scheme);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.get("/permissions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Permission scheme ID is required" });
        }
        const scheme = await PermissionSchemeService_1.default.getPermissionSchemeById(id);
        if (!scheme) {
            return res.status(404).json({ error: "Permission scheme not found" });
        }
        return res.json(scheme);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.patch("/permissions/:id", (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Permission scheme ID is required" });
        }
        const updates = req.body;
        const scheme = await PermissionSchemeService_1.default.updatePermissionScheme(id, updates);
        return res.json(scheme);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.delete("/permissions/:id", (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Permission scheme ID is required" });
        }
        await PermissionSchemeService_1.default.deletePermissionScheme(id);
        return res.json({ message: "Permission scheme deleted" });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
