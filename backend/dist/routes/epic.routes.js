"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const EpicController_1 = __importDefault(require("../controllers/EpicController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post("/projects/:projectId/epics", EpicController_1.default.createEpic);
router.get("/projects/:projectId/epics", EpicController_1.default.getProjectEpics);
router.get("/epics/:epicId", EpicController_1.default.getEpicById);
router.put("/epics/:epicId", EpicController_1.default.updateEpic);
router.delete("/epics/:epicId", EpicController_1.default.deleteEpic);
router.post("/epics/:epicId/tasks/:taskId", EpicController_1.default.addTaskToEpic);
router.delete("/tasks/:taskId/epic", EpicController_1.default.removeTaskFromEpic);
exports.default = router;
