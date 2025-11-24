"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const TaskAttachmentController_1 = __importDefault(require("../controllers/TaskAttachmentController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});
router.post("/tasks/:taskId/attachments", auth_1.authenticate, upload.single("file"), TaskAttachmentController_1.default.uploadAttachment);
router.get("/tasks/:taskId/attachments", auth_1.authenticate, TaskAttachmentController_1.default.getTaskAttachments);
router.get("/tasks/:taskId/attachments/stats", auth_1.authenticate, TaskAttachmentController_1.default.getTaskAttachmentStats);
router.get("/attachments/:id", auth_1.authenticate, TaskAttachmentController_1.default.getAttachment);
router.get("/attachments/:id/download", auth_1.authenticate, TaskAttachmentController_1.default.downloadAttachment);
router.delete("/attachments/:id", auth_1.authenticate, TaskAttachmentController_1.default.deleteAttachment);
router.get("/users/me/attachments", auth_1.authenticate, TaskAttachmentController_1.default.getUserAttachments);
exports.default = router;
