import prisma from "../db/prisma";

class AdvancedSearchService {
  /**
   * JQL-style search for tasks
   */
  async searchTasks(query: {
    projectId?: string;
    assigneeId?: string;
    status?: string[];
    priority?: string[];
    issueType?: string[];
    epicId?: string;
    sprintId?: string;
    labels?: string[];
    searchText?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
    hasAttachments?: boolean;
    hasComments?: boolean;
    isDependency?: boolean;
    storyPointsMin?: number;
    storyPointsMax?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    // Project filter
    if (query.projectId) {
      where.projectId = query.projectId;
    }

    // Assignee filter
    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    // Status filter (multiple)
    if (query.status && query.status.length > 0) {
      where.status = { in: query.status };
    }

    // Priority filter (multiple)
    if (query.priority && query.priority.length > 0) {
      where.priority = { in: query.priority };
    }

    // Issue type filter (multiple)
    if (query.issueType && query.issueType.length > 0) {
      where.issueType = { in: query.issueType };
    }

    // Epic filter
    if (query.epicId) {
      where.epicId = query.epicId;
    }

    // Sprint filter
    if (query.sprintId) {
      where.sprintId = query.sprintId;
    }

    // Labels filter (contains any)
    if (query.labels && query.labels.length > 0) {
      where.labels = { hasSome: query.labels };
    }

    // Text search (title or description)
    if (query.searchText) {
      where.OR = [
        { title: { contains: query.searchText, mode: "insensitive" } },
        { description: { contains: query.searchText, mode: "insensitive" } },
      ];
    }

    // Date filters
    if (query.createdAfter || query.createdBefore) {
      where.createdAt = {};
      if (query.createdAfter) where.createdAt.gte = query.createdAfter;
      if (query.createdBefore) where.createdAt.lte = query.createdBefore;
    }

    if (query.updatedAfter || query.updatedBefore) {
      where.updatedAt = {};
      if (query.updatedAfter) where.updatedAt.gte = query.updatedAfter;
      if (query.updatedBefore) where.updatedAt.lte = query.updatedBefore;
    }

    // Story points range
    if (
      query.storyPointsMin !== undefined ||
      query.storyPointsMax !== undefined
    ) {
      where.storyPoints = {};
      if (query.storyPointsMin !== undefined)
        where.storyPoints.gte = query.storyPointsMin;
      if (query.storyPointsMax !== undefined)
        where.storyPoints.lte = query.storyPointsMax;
    }

    // Build order by
    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    // Execute query
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
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
      prisma.task.count({ where }),
    ]);

    // Additional filtering after query (for complex conditions)
    let filteredTasks = tasks;

    if (query.hasAttachments === true) {
      filteredTasks = filteredTasks.filter(
        (t: any) => t.attachments && t.attachments.length > 0
      );
    } else if (query.hasAttachments === false) {
      filteredTasks = filteredTasks.filter(
        (t: any) => !t.attachments || t.attachments.length === 0
      );
    }

    if (query.hasComments === true) {
      filteredTasks = filteredTasks.filter(
        (t: any) => t.comments && t.comments.length > 0
      );
    } else if (query.hasComments === false) {
      filteredTasks = filteredTasks.filter(
        (t: any) => !t.comments || t.comments.length === 0
      );
    }

    if (query.isDependency === true) {
      filteredTasks = filteredTasks.filter(
        (t: any) => t.dependentOn && t.dependentOn.length > 0
      );
    } else if (query.isDependency === false) {
      filteredTasks = filteredTasks.filter(
        (t: any) => !t.dependentOn || t.dependentOn.length === 0
      );
    }

    return {
      tasks: filteredTasks,
      total,
      limit: query.limit || 50,
      offset: query.offset || 0,
      hasMore: (query.offset || 0) + filteredTasks.length < total,
    };
  }

  /**
   * Parse JQL-style query string
   * Example: "project = PROJ1 AND status IN (OPEN, IN_PROGRESS) AND assignee = user123"
   */
  parseJQL(jqlString: string) {
    const query: any = {};

    // Simple JQL parser (can be extended)
    const patterns = {
      project: /project\s*=\s*"?([^"\s]+)"?/i,
      assignee: /assignee\s*=\s*"?([^"\s]+)"?/i,
      status: /status\s+IN\s*\(([^)]+)\)/i,
      priority: /priority\s+IN\s*\(([^)]+)\)/i,
      text: /text\s*~\s*"([^"]+)"/i,
      labels: /labels\s+IN\s*\(([^)]+)\)/i,
    };

    // Extract project
    const projectMatch = jqlString.match(patterns.project);
    if (projectMatch) query.projectId = projectMatch[1];

    // Extract assignee
    const assigneeMatch = jqlString.match(patterns.assignee);
    if (assigneeMatch) query.assigneeId = assigneeMatch[1];

    // Extract status list
    const statusMatch = jqlString.match(patterns.status);
    if (statusMatch && statusMatch[1]) {
      query.status = statusMatch[1].split(",").map((s) => s.trim());
    }

    // Extract priority list
    const priorityMatch = jqlString.match(patterns.priority);
    if (priorityMatch && priorityMatch[1]) {
      query.priority = priorityMatch[1].split(",").map((p) => p.trim());
    }

    // Extract text search
    const textMatch = jqlString.match(patterns.text);
    if (textMatch && textMatch[1]) query.searchText = textMatch[1];

    // Extract labels
    const labelsMatch = jqlString.match(patterns.labels);
    if (labelsMatch && labelsMatch[1]) {
      query.labels = labelsMatch[1].split(",").map((l) => l.trim());
    }

    return query;
  }
}

export default new AdvancedSearchService();
