"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../db/prisma"));
class AdvancedSearchService {
    async searchTasks(query) {
        const where = {};
        if (query.projectId) {
            where.projectId = query.projectId;
        }
        if (query.assigneeId) {
            where.assigneeId = query.assigneeId;
        }
        if (query.status && query.status.length > 0) {
            where.status = { in: query.status };
        }
        if (query.priority && query.priority.length > 0) {
            where.priority = { in: query.priority };
        }
        if (query.issueType && query.issueType.length > 0) {
            where.issueType = { in: query.issueType };
        }
        if (query.epicId) {
            where.epicId = query.epicId;
        }
        if (query.sprintId) {
            where.sprintId = query.sprintId;
        }
        if (query.labels && query.labels.length > 0) {
            where.labels = { hasSome: query.labels };
        }
        if (query.searchText) {
            where.OR = [
                { title: { contains: query.searchText, mode: "insensitive" } },
                { description: { contains: query.searchText, mode: "insensitive" } },
            ];
        }
        if (query.createdAfter || query.createdBefore) {
            where.createdAt = {};
            if (query.createdAfter)
                where.createdAt.gte = query.createdAfter;
            if (query.createdBefore)
                where.createdAt.lte = query.createdBefore;
        }
        if (query.updatedAfter || query.updatedBefore) {
            where.updatedAt = {};
            if (query.updatedAfter)
                where.updatedAt.gte = query.updatedAfter;
            if (query.updatedBefore)
                where.updatedAt.lte = query.updatedBefore;
        }
        if (query.storyPointsMin !== undefined ||
            query.storyPointsMax !== undefined) {
            where.storyPoints = {};
            if (query.storyPointsMin !== undefined)
                where.storyPoints.gte = query.storyPointsMin;
            if (query.storyPointsMax !== undefined)
                where.storyPoints.lte = query.storyPointsMax;
        }
        const orderBy = {};
        if (query.sortBy) {
            orderBy[query.sortBy] = query.sortOrder || "asc";
        }
        else {
            orderBy.createdAt = "desc";
        }
        const [tasks, total] = await Promise.all([
            prisma_1.default.task.findMany({
                where,
                include: {
                    assignee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    creator: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    epic: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                        },
                    },
                    sprint: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                        },
                    },
                    attachments: query.hasAttachments
                        ? true
                        : {
                            select: {
                                id: true,
                            },
                            take: 1,
                        },
                    comments: query.hasComments
                        ? true
                        : {
                            select: {
                                id: true,
                            },
                            take: 1,
                        },
                    dependentOn: query.isDependency
                        ? {
                            include: {
                                blockingTask: {
                                    select: {
                                        id: true,
                                        title: true,
                                    },
                                },
                            },
                        }
                        : false,
                },
                orderBy,
                take: query.limit || 50,
                skip: query.offset || 0,
            }),
            prisma_1.default.task.count({ where }),
        ]);
        let filteredTasks = tasks;
        if (query.hasAttachments === true) {
            filteredTasks = filteredTasks.filter((t) => t.attachments && t.attachments.length > 0);
        }
        else if (query.hasAttachments === false) {
            filteredTasks = filteredTasks.filter((t) => !t.attachments || t.attachments.length === 0);
        }
        if (query.hasComments === true) {
            filteredTasks = filteredTasks.filter((t) => t.comments && t.comments.length > 0);
        }
        else if (query.hasComments === false) {
            filteredTasks = filteredTasks.filter((t) => !t.comments || t.comments.length === 0);
        }
        if (query.isDependency === true) {
            filteredTasks = filteredTasks.filter((t) => t.dependentOn && t.dependentOn.length > 0);
        }
        else if (query.isDependency === false) {
            filteredTasks = filteredTasks.filter((t) => !t.dependentOn || t.dependentOn.length === 0);
        }
        return {
            tasks: filteredTasks,
            total,
            limit: query.limit || 50,
            offset: query.offset || 0,
            hasMore: (query.offset || 0) + filteredTasks.length < total,
        };
    }
    parseJQL(jqlString) {
        const query = {};
        const patterns = {
            project: /project\s*=\s*"?([^"\s]+)"?/i,
            assignee: /assignee\s*=\s*"?([^"\s]+)"?/i,
            status: /status\s+IN\s*\(([^)]+)\)/i,
            priority: /priority\s+IN\s*\(([^)]+)\)/i,
            text: /text\s*~\s*"([^"]+)"/i,
            labels: /labels\s+IN\s*\(([^)]+)\)/i,
        };
        const projectMatch = jqlString.match(patterns.project);
        if (projectMatch)
            query.projectId = projectMatch[1];
        const assigneeMatch = jqlString.match(patterns.assignee);
        if (assigneeMatch)
            query.assigneeId = assigneeMatch[1];
        const statusMatch = jqlString.match(patterns.status);
        if (statusMatch && statusMatch[1]) {
            query.status = statusMatch[1].split(",").map((s) => s.trim());
        }
        const priorityMatch = jqlString.match(patterns.priority);
        if (priorityMatch && priorityMatch[1]) {
            query.priority = priorityMatch[1].split(",").map((p) => p.trim());
        }
        const textMatch = jqlString.match(patterns.text);
        if (textMatch && textMatch[1])
            query.searchText = textMatch[1];
        const labelsMatch = jqlString.match(patterns.labels);
        if (labelsMatch && labelsMatch[1]) {
            query.labels = labelsMatch[1].split(",").map((l) => l.trim());
        }
        return query;
    }
}
exports.default = new AdvancedSearchService();
