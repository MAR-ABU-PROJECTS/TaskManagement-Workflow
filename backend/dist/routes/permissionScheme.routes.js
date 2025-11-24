"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const enums_1 = require("../types/enums");
const PermissionSchemeService_1 = __importDefault(require("../services/PermissionSchemeService"));
const router = (0, express_1.Router)();
router.get("/", auth_1.authenticate, async (_req, res) => {
    try {
        const schemes = await PermissionSchemeService_1.default.getAllPermissionSchemes();
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
router.get("/:id", auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "id is required" });
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
router.put("/:id", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isDefault } = req.body;
        if (!id) {
            return res.status(400).json({ error: "id is required" });
        }
        const scheme = await PermissionSchemeService_1.default.updatePermissionScheme(id, {
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
        await PermissionSchemeService_1.default.deletePermissionScheme(id);
        return res.json({ message: "Permission scheme deleted successfully" });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
});
router.post("/:id/grants", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id: schemeId } = req.params;
        const { permission, grantedToRole, grantedToUserRole } = req.body;
        if (!schemeId) {
            return res.status(400).json({ error: "schemeId is required" });
        }
        if (!permission) {
            return res.status(400).json({ error: "permission is required" });
        }
        const grant = await PermissionSchemeService_1.default.addGrant({
            schemeId,
            permission,
            grantedToRole,
            grantedToUserRole,
        });
        return res.status(201).json(grant);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.get("/:id/grants", auth_1.authenticate, async (req, res) => {
    try {
        const { id: schemeId } = req.params;
        if (!schemeId) {
            return res.status(400).json({ error: "schemeId is required" });
        }
        const grants = await PermissionSchemeService_1.default.getGrants(schemeId);
        return res.json(grants);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.put("/:id/grants/bulk", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { id: schemeId } = req.params;
        const { grants } = req.body;
        if (!schemeId) {
            return res.status(400).json({ error: "schemeId is required" });
        }
        if (!Array.isArray(grants)) {
            return res.status(400).json({ error: "grants must be an array" });
        }
        const updatedGrants = await PermissionSchemeService_1.default.bulkUpdateGrants(schemeId, grants);
        return res.json(updatedGrants);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.delete("/grants/:grantId", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { grantId } = req.params;
        if (!grantId) {
            return res.status(400).json({ error: "grantId is required" });
        }
        await PermissionSchemeService_1.default.removeGrant(grantId);
        return res.json({ message: "Grant removed successfully" });
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
        const project = await PermissionSchemeService_1.default.assignToProject(projectId, schemeId);
        return res.json(project);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.post("/default/create", auth_1.authenticate, (0, rbac_1.requireRoles)(enums_1.UserRole.ADMIN), async (_req, res) => {
    try {
        const scheme = await PermissionSchemeService_1.default.createDefaultScheme();
        return res.status(201).json(scheme);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
