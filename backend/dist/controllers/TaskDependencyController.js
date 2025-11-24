"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskDependencyController = void 0;
const TaskDependencyService_1 = __importStar(require("../services/TaskDependencyService"));
class TaskDependencyController {
    async createDependency(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { dependentTaskId, blockingTaskId, type } = req.body;
            if (!dependentTaskId || !blockingTaskId) {
                return res.status(400).json({
                    message: "dependentTaskId and blockingTaskId are required",
                });
            }
            const dependency = await TaskDependencyService_1.default.createDependency(dependentTaskId, blockingTaskId, type || TaskDependencyService_1.DependencyType.BLOCKS);
            return res.status(201).json({
                message: "Dependency created successfully",
                data: dependency,
            });
        }
        catch (error) {
            if (error.message.includes("not found") ||
                error.message.includes("circular") ||
                error.message.includes("already exists") ||
                error.message.includes("cannot depend")) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({
                message: "Failed to create dependency",
                error: error.message,
            });
        }
    }
    async getAllDependencies(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { projectId, type } = req.query;
            const dependencies = await TaskDependencyService_1.default.getAllDependencies({
                projectId: projectId,
                type: type,
            });
            return res.status(200).json({
                message: "Dependencies retrieved successfully",
                data: dependencies,
                count: dependencies.length,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve dependencies",
                error: error.message,
            });
        }
    }
    async getTaskDependencies(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { taskId } = req.params;
            if (!taskId) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const dependencies = await TaskDependencyService_1.default.getTaskDependencies(taskId);
            return res.status(200).json({
                message: "Task dependencies retrieved successfully",
                data: dependencies,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve task dependencies",
                error: error.message,
            });
        }
    }
    async getBlockingInfo(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { taskId } = req.params;
            if (!taskId) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const blockingInfo = await TaskDependencyService_1.default.getBlockingInfo(taskId);
            return res.status(200).json({
                message: "Blocking info retrieved successfully",
                data: blockingInfo,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve blocking info",
                error: error.message,
            });
        }
    }
    async getSubtaskSummary(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { taskId } = req.params;
            if (!taskId) {
                return res.status(400).json({ message: "Task ID is required" });
            }
            const summary = await TaskDependencyService_1.default.getSubtaskSummary(taskId);
            return res.status(200).json({
                message: "Subtask summary retrieved successfully",
                data: summary,
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve subtask summary",
                error: error.message,
            });
        }
    }
    async deleteDependency(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: "Dependency ID is required" });
            }
            const deleted = await TaskDependencyService_1.default.deleteDependency(id);
            if (!deleted) {
                return res.status(404).json({ message: "Dependency not found" });
            }
            return res.status(200).json({
                message: "Dependency deleted successfully",
            });
        }
        catch (error) {
            return res.status(500).json({
                message: "Failed to delete dependency",
                error: error.message,
            });
        }
    }
}
exports.TaskDependencyController = TaskDependencyController;
exports.default = new TaskDependencyController();
