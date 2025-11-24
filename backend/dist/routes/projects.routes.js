"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const enums_1 = require("../types/enums");
const ProjectController_1 = __importDefault(require("../controllers/ProjectController"));
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post("/", rbac_1.canCreateProject, (req, res) => ProjectController_1.default.createProject(req, res));
router.get("/", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), (req, res) => ProjectController_1.default.getAllProjects(req, res));
router.get("/:id", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), (req, res) => ProjectController_1.default.getProjectById(req, res));
router.patch("/:id", (0, rbac_1.hasProjectPermission)(enums_1.Permission.EDIT_PROJECT), (req, res) => ProjectController_1.default.updateProject(req, res));
router.delete("/:id", (0, rbac_1.hasProjectPermission)(enums_1.Permission.ADMINISTER_PROJECT), (req, res) => ProjectController_1.default.archiveProject(req, res));
exports.default = router;
