"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ReportController_1 = __importDefault(require("../controllers/ReportController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get("/projects/:projectId/reports/velocity", ReportController_1.default.getVelocityReport);
router.get("/projects/:projectId/reports/productivity", ReportController_1.default.getTeamProductivity);
router.get("/projects/:projectId/reports/health", ReportController_1.default.getProjectHealth);
router.get("/projects/:projectId/reports/cycle-time", ReportController_1.default.getCycleTimeReport);
router.get("/projects/:projectId/reports/burnup", ReportController_1.default.getBurnupData);
exports.default = router;
