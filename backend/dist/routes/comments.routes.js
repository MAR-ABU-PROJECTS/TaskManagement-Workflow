"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const CommentActivityController_1 = require("../controllers/CommentActivityController");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post("/:id/comments", (req, res) => CommentActivityController_1.commentController.createComment(req, res));
router.get("/:id/comments", (req, res) => CommentActivityController_1.commentController.getTaskComments(req, res));
router.delete("/:taskId/comments/:commentId", (req, res) => CommentActivityController_1.commentController.deleteComment(req, res));
router.get("/:id/logs", (req, res) => CommentActivityController_1.activityLogController.getTaskLogs(req, res));
exports.default = router;
