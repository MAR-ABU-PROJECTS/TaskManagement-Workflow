"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const UserHierarchyController_1 = __importDefault(require("../controllers/UserHierarchyController"));
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get("/hierarchy", (req, res) => UserHierarchyController_1.default.getUserHierarchy(req, res));
router.get("/promotable", (req, res) => UserHierarchyController_1.default.getPromotableUsers(req, res));
router.get("/available-roles", (req, res) => UserHierarchyController_1.default.getAvailableRoles(req, res));
router.get("/super-admin/verify", (req, res) => UserHierarchyController_1.default.verifySuperAdminCount(req, res));
router.post("/:userId/promote", (req, res) => UserHierarchyController_1.default.promoteUser(req, res));
router.post("/:userId/demote", (req, res) => UserHierarchyController_1.default.demoteUser(req, res));
router.delete("/:userId", (req, res) => UserHierarchyController_1.default.removeUser(req, res));
exports.default = router;
