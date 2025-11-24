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
const router = (0, express_1.Router)();
router.get("/", auth_1.authenticate, async (_req, res) => {
    try {
        const schemes = await WorkflowService_1.default.getAllWorkflowSchemes();
        return res.json(schemes);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
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
router.get("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "id is required" });
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
router.put("/:id", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isDefault } = req.body;
        if (!id) {
            return res.status(400).json({ error: "id is required" });
        }
        const scheme = await WorkflowService_1.default.updateWorkflowScheme(id, {
            name,
            description,
            isDefault,
        });
        return res.json(scheme);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.delete("/:id", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "id is required" });
        }
        await WorkflowService_1.default.deleteWorkflowScheme(id);
        return res.json({ message: "Workflow scheme deleted successfully" });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
});
router.post("/:id/transitions", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id: schemeId } = req.params;
        const { name, fromStatus, toStatus, issueType, requiredRole } = req.body;
        if (!schemeId) {
            return res.status(400).json({ error: "schemeId is required" });
        }
        if (!name || !fromStatus || !toStatus) {
            return res
                .status(400)
                .json({ error: "name, fromStatus, and toStatus are required" });
        }
        const transition = await WorkflowService_1.default.addTransition({
            schemeId,
            name,
            fromStatus,
            toStatus,
            issueType,
            requiredRole,
        });
        return res.status(201).json(transition);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.get("/:id/transitions", auth_1.authenticate, async (req, res) => {
    try {
        const { id: schemeId } = req.params;
        const { issueType } = req.query;
        if (!schemeId) {
            return res.status(400).json({ error: "schemeId is required" });
        }
        const transitions = await WorkflowService_1.default.getTransitions(schemeId, issueType);
        return res.json(transitions);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.delete("/transitions/:transitionId", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { transitionId } = req.params;
        if (!transitionId) {
            return res.status(400).json({ error: "transitionId is required" });
        }
        await WorkflowService_1.default.deleteTransition(transitionId);
        return res.json({ message: "Transition deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/:id/assign-project", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id: schemeId } = req.params;
        const { projectId } = req.body;
        if (!schemeId) {
            return res.status(400).json({ error: "schemeId is required" });
        }
        if (!projectId) {
            return res.status(400).json({ error: "projectId is required" });
        }
        const project = await WorkflowService_1.default.assignToProject(projectId, schemeId);
        return res.json(project);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/default/create", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (_req, res) => {
    try {
        const scheme = await WorkflowService_1.default.createDefaultScheme();
        return res.status(201).json(scheme);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
