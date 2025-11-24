import prisma from "../db/prisma";
import { TaskStatus, IssueType, ProjectRole } from "../types/enums";

export class WorkflowService {
  /**
   * Create a new workflow scheme
   */
  async createWorkflowScheme(data: {
    name: string;
    description?: string;
    isDefault?: boolean;
  }) {
    return await prisma.workflowScheme.create({
      data: {
        name: data.name,
        description: data.description,
        isDefault: data.isDefault || false,
      },
      include: {
        transitions: true,
      },
    });
  }

  /**
   * Get all workflow schemes
   */
  async getAllWorkflowSchemes() {
    return await prisma.workflowScheme.findMany({
      include: {
        transitions: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get workflow scheme by ID
   */
  async getWorkflowSchemeById(id: string) {
    return await prisma.workflowScheme.findUnique({
      where: { id },
      include: {
        transitions: {
          orderBy: { createdAt: "asc" },
        },
        projects: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
      },
    });
  }

  /**
   * Update workflow scheme
   */
  async updateWorkflowScheme(
    id: string,
    data: {
      name?: string;
      description?: string;
      isDefault?: boolean;
    }
  ) {
    return await prisma.workflowScheme.update({
      where: { id },
      data,
      include: {
        transitions: true,
      },
    });
  }

  /**
   * Delete workflow scheme
   */
  async deleteWorkflowScheme(id: string) {
    // Check if scheme is assigned to projects
    const scheme = await prisma.workflowScheme.findUnique({
      where: { id },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    if (!scheme) {
      throw new Error("Workflow scheme not found");
    }

    if (scheme._count.projects > 0) {
      throw new Error(
        "Cannot delete workflow scheme that is assigned to projects"
      );
    }

    return await prisma.workflowScheme.delete({
      where: { id },
    });
  }

  /**
   * Add transition to workflow scheme
   */
  async addTransition(data: {
    schemeId: string;
    name: string;
    fromStatus: TaskStatus;
    toStatus: TaskStatus;
    issueType?: IssueType;
    requiredRole?: ProjectRole;
  }) {
    return await prisma.workflowTransition.create({
      data: {
        schemeId: data.schemeId,
        name: data.name,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        issueType: data.issueType,
        requiredRole: data.requiredRole,
      },
    });
  }

  /**
   * Get transitions for a workflow scheme
   */
  async getTransitions(schemeId: string, issueType?: IssueType) {
    return await prisma.workflowTransition.findMany({
      where: {
        schemeId,
        ...(issueType ? { issueType } : {}),
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Delete transition
   */
  async deleteTransition(transitionId: string) {
    return await prisma.workflowTransition.delete({
      where: { id: transitionId },
    });
  }

  /**
   * Validate if a status transition is allowed
   */
  async validateTransition(
    projectId: string,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    issueType: IssueType,
    userProjectRole?: ProjectRole
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Get project's workflow scheme
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workflowScheme: {
          include: {
            transitions: true,
          },
        },
      },
    });

    // If no workflow scheme, allow all transitions (default behavior)
    if (!project?.workflowScheme) {
      return { allowed: true };
    }

    // Find matching transition
    const transition = project.workflowScheme.transitions.find(
      (t) =>
        t.fromStatus === fromStatus &&
        t.toStatus === toStatus &&
        (!t.issueType || t.issueType === issueType)
    );

    if (!transition) {
      return {
        allowed: false,
        reason: `No transition defined from ${fromStatus} to ${toStatus}`,
      };
    }

    // Check role requirement
    if (transition.requiredRole && userProjectRole) {
      const roleHierarchy: Record<ProjectRole, number> = {
        [ProjectRole.VIEWER]: 0,
        [ProjectRole.REPORTER]: 1,
        [ProjectRole.DEVELOPER]: 2,
        [ProjectRole.PROJECT_LEAD]: 3,
        [ProjectRole.PROJECT_ADMIN]: 4,
      };

      const userLevel = roleHierarchy[userProjectRole] || 0;
      const requiredLevel = roleHierarchy[transition.requiredRole] || 0;

      if (userLevel < requiredLevel) {
        return {
          allowed: false,
          reason: `Requires ${transition.requiredRole} role or higher`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Get available transitions for a task
   */
  async getAvailableTransitions(
    taskId: string,
    userId: string
  ): Promise<
    Array<{
      name: string;
      toStatus: TaskStatus;
      requiredRole?: ProjectRole;
    }>
  > {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workflowScheme: {
              include: {
                transitions: true,
              },
            },
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!task?.project?.workflowScheme) {
      return [];
    }

    const transitions = task.project.workflowScheme.transitions.filter(
      (t) =>
        t.fromStatus === task.status &&
        (!t.issueType || t.issueType === task.issueType)
    );

    return transitions.map((t) => ({
      name: t.name,
      toStatus: t.toStatus as TaskStatus,
      requiredRole: t.requiredRole as ProjectRole | undefined,
    }));
  }

  /**
   * Assign workflow scheme to project
   */
  async assignToProject(projectId: string, schemeId: string) {
    return await prisma.project.update({
      where: { id: projectId },
      data: {
        workflowSchemeId: schemeId,
      },
      include: {
        workflowScheme: {
          include: {
            transitions: true,
          },
        },
      },
    });
  }

  /**
   * Create default workflow scheme with standard transitions
   */
  async createDefaultScheme() {
    // Check if default already exists
    const existing = await prisma.workflowScheme.findFirst({
      where: { isDefault: true },
    });

    if (existing) {
      return existing;
    }

    // Create default scheme
    const scheme = await prisma.workflowScheme.create({
      data: {
        name: "Default Workflow",
        description: "Standard workflow with common transitions",
        isDefault: true,
      },
    });

    // Add standard transitions
    const transitions = [
      // DRAFT transitions
      {
        name: "Start Progress",
        fromStatus: TaskStatus.DRAFT,
        toStatus: TaskStatus.ASSIGNED,
        requiredRole: ProjectRole.DEVELOPER,
      },
      // ASSIGNED transitions
      {
        name: "Begin Work",
        fromStatus: TaskStatus.ASSIGNED,
        toStatus: TaskStatus.IN_PROGRESS,
        requiredRole: ProjectRole.DEVELOPER,
      },
      // IN_PROGRESS transitions
      {
        name: "Pause Work",
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.PAUSED,
        requiredRole: ProjectRole.DEVELOPER,
      },
      {
        name: "Submit for Review",
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.REVIEW,
        requiredRole: ProjectRole.DEVELOPER,
      },
      // PAUSED transitions
      {
        name: "Resume Work",
        fromStatus: TaskStatus.PAUSED,
        toStatus: TaskStatus.IN_PROGRESS,
        requiredRole: ProjectRole.DEVELOPER,
      },
      // REVIEW transitions
      {
        name: "Approve",
        fromStatus: TaskStatus.REVIEW,
        toStatus: TaskStatus.COMPLETED,
        requiredRole: ProjectRole.PROJECT_LEAD,
      },
      {
        name: "Reject",
        fromStatus: TaskStatus.REVIEW,
        toStatus: TaskStatus.REJECTED,
        requiredRole: ProjectRole.PROJECT_LEAD,
      },
      {
        name: "Request Changes",
        fromStatus: TaskStatus.REVIEW,
        toStatus: TaskStatus.IN_PROGRESS,
        requiredRole: ProjectRole.PROJECT_LEAD,
      },
      // REJECTED transitions
      {
        name: "Reopen",
        fromStatus: TaskStatus.REJECTED,
        toStatus: TaskStatus.ASSIGNED,
        requiredRole: ProjectRole.DEVELOPER,
      },
      // COMPLETED transitions (for reopening)
      {
        name: "Reopen Completed",
        fromStatus: TaskStatus.COMPLETED,
        toStatus: TaskStatus.IN_PROGRESS,
        requiredRole: ProjectRole.PROJECT_LEAD,
      },
    ];

    await prisma.workflowTransition.createMany({
      data: transitions.map((t) => ({
        schemeId: scheme.id,
        ...t,
      })),
    });

    return await this.getWorkflowSchemeById(scheme.id);
  }
}

export default new WorkflowService();
