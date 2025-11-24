import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";

export class SavedFilterService {
  /**
   * Create a new saved filter
   */
  async createFilter(data: {
    name: string;
    description?: string;
    jql: string;
    projectId?: string;
    isPublic: boolean;
    userId: string;
  }) {
    const filter = await prisma.savedFilter.create({
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

  /**
   * Get all filters accessible by a user
   */
  async getUserFilters(userId: string) {
    const where: Prisma.SavedFilterWhereInput = {
      OR: [
        { userId }, // Filters owned by user
        { isPublic: true }, // Public filters
      ],
    };

    const filters = await prisma.savedFilter.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return filters;
  }

  /**
   * Get filter by ID
   */
  async getFilterById(filterId: string, userId: string) {
    const filter = await prisma.savedFilter.findUnique({
      where: { id: filterId },
    });

    if (!filter) {
      throw new Error("Filter not found");
    }

    // Check access permissions
    if (!filter.isPublic && filter.userId !== userId) {
      throw new Error("Access denied to this filter");
    }

    return filter;
  }

  /**
   * Update a filter
   */
  async updateFilter(
    filterId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      jql?: string;
      isPublic?: boolean;
    }
  ) {
    const filter = await prisma.savedFilter.findUnique({
      where: { id: filterId },
    });

    if (!filter) {
      throw new Error("Filter not found");
    }

    if (filter.userId !== userId) {
      throw new Error("Only the owner can update this filter");
    }

    const updated = await prisma.savedFilter.update({
      where: { id: filterId },
      data,
    });

    return updated;
  }

  /**
   * Delete a filter
   */
  async deleteFilter(filterId: string, userId: string) {
    const filter = await prisma.savedFilter.findUnique({
      where: { id: filterId },
    });

    if (!filter) {
      throw new Error("Filter not found");
    }

    if (filter.userId !== userId) {
      throw new Error("Only the owner can delete this filter");
    }

    await prisma.savedFilter.delete({
      where: { id: filterId },
    });

    return { message: "Filter deleted successfully" };
  }

  /**
   * Share filter with users (make public or add to favorites)
   */
  async shareFilter(filterId: string, userId: string) {
    const filter = await prisma.savedFilter.findUnique({
      where: { id: filterId },
    });

    if (!filter) {
      throw new Error("Filter not found");
    }

    if (filter.userId !== userId) {
      throw new Error("Only the owner can share this filter");
    }

    const updated = await prisma.savedFilter.update({
      where: { id: filterId },
      data: { isPublic: true },
    });

    return updated;
  }

  /**
   * Clone a filter (duplicate)
   */
  async cloneFilter(filterId: string, userId: string, newName?: string) {
    const original = await this.getFilterById(filterId, userId);

    const cloned = await prisma.savedFilter.create({
      data: {
        name: newName || `${original.name} (Copy)`,
        description: original.description,
        jql: original.jql,
        isPublic: false, // Clones are private by default
        userId: userId,
      },
    });

    return cloned;
  }
}

export default new SavedFilterService();
