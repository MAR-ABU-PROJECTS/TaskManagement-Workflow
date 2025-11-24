"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedFilterService = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
class SavedFilterService {
    async createFilter(data) {
        const filter = await prisma_1.default.savedFilter.create({
            data: {
                name: data.name,
                description: data.description,
                jql: data.jql,
                isPublic: data.isPublic,
                userId: data.userId,
            },
        });
        return filter;
    }
    async getUserFilters(userId) {
        const where = {
            OR: [
                { userId },
                { isPublic: true },
            ],
        };
        const filters = await prisma_1.default.savedFilter.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        return filters;
    }
    async getFilterById(filterId, userId) {
        const filter = await prisma_1.default.savedFilter.findUnique({
            where: { id: filterId },
        });
        if (!filter) {
            throw new Error("Filter not found");
        }
        if (!filter.isPublic && filter.userId !== userId) {
            throw new Error("Access denied to this filter");
        }
        return filter;
    }
    async updateFilter(filterId, userId, data) {
        const filter = await prisma_1.default.savedFilter.findUnique({
            where: { id: filterId },
        });
        if (!filter) {
            throw new Error("Filter not found");
        }
        if (filter.userId !== userId) {
            throw new Error("Only the owner can update this filter");
        }
        const updated = await prisma_1.default.savedFilter.update({
            where: { id: filterId },
            data,
        });
        return updated;
    }
    async deleteFilter(filterId, userId) {
        const filter = await prisma_1.default.savedFilter.findUnique({
            where: { id: filterId },
        });
        if (!filter) {
            throw new Error("Filter not found");
        }
        if (filter.userId !== userId) {
            throw new Error("Only the owner can delete this filter");
        }
        await prisma_1.default.savedFilter.delete({
            where: { id: filterId },
        });
        return { message: "Filter deleted successfully" };
    }
    async shareFilter(filterId, userId) {
        const filter = await prisma_1.default.savedFilter.findUnique({
            where: { id: filterId },
        });
        if (!filter) {
            throw new Error("Filter not found");
        }
        if (filter.userId !== userId) {
            throw new Error("Only the owner can share this filter");
        }
        const updated = await prisma_1.default.savedFilter.update({
            where: { id: filterId },
            data: { isPublic: true },
        });
        return updated;
    }
    async cloneFilter(filterId, userId, newName) {
        const original = await this.getFilterById(filterId, userId);
        const cloned = await prisma_1.default.savedFilter.create({
            data: {
                name: newName || `${original.name} (Copy)`,
                description: original.description,
                jql: original.jql,
                isPublic: false,
                userId: userId,
            },
        });
        return cloned;
    }
}
exports.SavedFilterService = SavedFilterService;
exports.default = new SavedFilterService();
