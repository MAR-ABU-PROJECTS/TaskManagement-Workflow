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
router.get("/", (req, res) => CommentActivityController_1.notificationController.getUserNotifications(req, res));
router.patch("/:id/read", (req, res) => CommentActivityController_1.notificationController.markAsRead(req, res));
router.patch("/read-all", (req, res) => CommentActivityController_1.notificationController.markAllAsRead(req, res));
exports.default = router;
