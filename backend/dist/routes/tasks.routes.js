"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const enums_1 = require("../types/enums");
const TaskController_1 = __importDefault(require("../controllers/TaskController"));
const CommentActivityController_1 = require("../controllers/CommentActivityController");
const TaskAttachmentController_1 = __importDefault(require("../controllers/TaskAttachmentController"));
const TaskDependencyController_1 = __importDefault(require("../controllers/TaskDependencyController"));
const TimeTrackingController_1 = __importDefault(require("../controllers/TimeTrackingController"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});
router.use(auth_1.authenticate);
router.post("/", (0, rbac_1.hasProjectPermission)(enums_1.Permission.CREATE_ISSUES), (req, res) => TaskController_1.default.createTask(req, res));
router.get("/", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), (req, res) => TaskController_1.default.getAllTasks(req, res));
router.post("/bulk", (0, rbac_1.hasProjectPermission)(enums_1.Permission.EDIT_ISSUES), async (req, res) => {
    try {
        const { operation, taskIds } = req.body;
        if (!operation || !taskIds || !Array.isArray(taskIds)) {
            return res.status(400).json({ message: "Invalid bulk operation" });
        }
        let result;
        switch (operation) {
            case "delete":
                result = { deleted: taskIds.length };
                break;
            case "update":
                result = { updated: taskIds.length };
                break;
            case "assign":
                result = { assigned: taskIds.length };
                break;
            default:
                return res.status(400).json({ message: "Unknown operation" });
        }
        return res.json({ message: "Bulk operation completed", result });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
router.get("/:id", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), (req, res) => TaskController_1.default.getTaskById(req, res));
router.patch("/:id", rbac_1.canEditIssue, (req, res) => TaskController_1.default.updateTask(req, res));
router.post("/:id/assign", (0, rbac_1.hasProjectPermission)(enums_1.Permission.ASSIGN_ISSUES), (req, res) => TaskController_1.default.assignTask(req, res));
router.post("/:id/transition", (0, rbac_1.hasProjectPermission)(enums_1.Permission.TRANSITION_ISSUES), (req, res) => TaskController_1.default.changeStatus(req, res));
router.post("/:id/approve", rbac_1.canApproveTask, (req, res) => TaskController_1.default.approveTask(req, res));
router.post("/:id/reject", rbac_1.canApproveTask, (req, res) => TaskController_1.default.rejectTask(req, res));
router.get(":id/comments", (req, res) => CommentActivityController_1.commentController.getTaskComments(req, res));
router.post("/:id/comments", (req, res) => CommentActivityController_1.commentController.createComment(req, res));
router.delete("/:taskId/comments/:commentId", (req, res) => CommentActivityController_1.commentController.deleteComment(req, res));
router.get("/:taskId/attachments", auth_1.authenticate, (req, res) => TaskAttachmentController_1.default.getTaskAttachments(req, res));
router.post("/:taskId/attachments", auth_1.authenticate, upload.single("file"), (req, res) => TaskAttachmentController_1.default.uploadAttachment(req, res));
router.get("/:taskId/attachments/:attachmentId", auth_1.authenticate, (req, res) => TaskAttachmentController_1.default.downloadAttachment(req, res));
router.delete("/:taskId/attachments/:attachmentId", auth_1.authenticate, (req, res) => TaskAttachmentController_1.default.deleteAttachment(req, res));
router.get("/:id/dependencies", (req, res) => TaskDependencyController_1.default.getTaskDependencies(req, res));
router.post("/:id/dependencies", (req, res) => TaskDependencyController_1.default.createDependency(req, res));
router.delete("/:taskId/dependencies/:dependencyId", (req, res) => TaskDependencyController_1.default.deleteDependency(req, res));
router.get("/:taskId/time-entries", (req, res) => TimeTrackingController_1.default.getTaskTimeEntries(req, res));
router.post("/:taskId/time-entries", (req, res) => TimeTrackingController_1.default.logTime(req, res));
router.patch("/:taskId/time-entries/:entryId", (req, res) => TimeTrackingController_1.default.updateTimeEntry(req, res));
router.delete("/:taskId/time-entries/:entryId", (req, res) => TimeTrackingController_1.default.deleteTimeEntry(req, res));
router.get(":id/activity", (req, res) => CommentActivityController_1.activityLogController.getTaskLogs(req, res));
exports.default = router;
