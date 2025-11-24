"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const TaskDependencyController_1 = __importDefault(require("../controllers/TaskDependencyController"));
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post("/", (req, res) => TaskDependencyController_1.default.createDependency(req, res));
router.get("/", (req, res) => TaskDependencyController_1.default.getAllDependencies(req, res));
router.get("/tasks/:taskId", (req, res) => TaskDependencyController_1.default.getTaskDependencies(req, res));
router.get("/tasks/:taskId/blocking-info", (req, res) => TaskDependencyController_1.default.getBlockingInfo(req, res));
router.get("/tasks/:taskId/subtask-summary", (req, res) => TaskDependencyController_1.default.getSubtaskSummary(req, res));
router.delete("/:id", (req, res) => TaskDependencyController_1.default.deleteDependency(req, res));
exports.default = router;
