import prisma from "../db/prisma";
import {
  CreateProjectDTO,
  UpdateProjectDTO,
  Project,
} from "../types/interfaces";
import {
  UserRole,
  Department,
  WorkflowType,
  ProjectRole,
} from "@prisma/client";

export class ProjectService {
  /**
   * Create a new project
   */
  async createProject(
    data: CreateProjectDTO,
    creatorId: string
  ): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        key: data.key,
        description: data.description || null,
        department: data.department || null,
        workflowType: (data.workflowType as WorkflowType) || WorkflowType.BASIC,
        workflowSchemeId: data.workflowSchemeId || null,
        creatorId,
      },
    });

    // Auto-assign creator as PROJECT_ADMIN
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: creatorId,
        role: ProjectRole.PROJECT_ADMIN,
        addedById: creatorId,
      },
    });

    return project as Project;
  }

  /**
   * Get all projects with optional filtering
   */
  async getAllProjects(
    userId: string,
    userRole: UserRole,
    userDepartment: Department | null
  ): Promise<Project[]> {
    // CEO sees all projects
    if (userRole === UserRole.CEO) {
      return (await prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      })) as any;
    }

    // HOO and HR see projects in their department or all if no department set
    if (userRole === UserRole.HOO || userRole === UserRole.HR) {
      return (await prisma.project.findMany({
        where: userDepartment
          ? {
              OR: [{ department: userDepartment }, { department: null }],
            }
          : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      })) as any;
    }

    // Admin and Staff see projects they created or are assigned tasks in
    return (await prisma.project.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { tasks: { some: { assigneeId: userId } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })) as any;
  }

  /**
   * Get project by ID
   */
  async getProjectById(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<Project | null> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assigneeId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      return null;
    }

    // Check access permissions
    const hasAccess =
      userRole === UserRole.CEO ||
      project.creatorId === userId ||
      project.tasks.some((task: any) => task.assigneeId === userId);

    if (!hasAccess) {
      return null;
    }

    return project as any;
  }

  /**
   * Update project
   */
  async updateProject(
    id: string,
    data: UpdateProjectDTO,
    userId: string,
    userRole: UserRole
  ): Promise<Project | null> {
    // Only creator, HOO, HR, or CEO can update
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return null;
    }

    const canUpdate =
      userRole === UserRole.CEO ||
      userRole === UserRole.HOO ||
      userRole === UserRole.HR ||
      project.creatorId === userId;

    if (!canUpdate) {
      throw new Error(
        "Forbidden: You do not have permission to update this project"
      );
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        department: data.department || null,
      },
    });

    return updated as Project;
  }

  /**
   * Archive (soft delete) project
   */
  async archiveProject(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<boolean> {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return false;
    }

    // Only CEO, HOO, HR, or creator can archive
    const canArchive =
      userRole === UserRole.CEO ||
      userRole === UserRole.HOO ||
      userRole === UserRole.HR ||
      project.creatorId === userId;

    if (!canArchive) {
      throw new Error(
        "Forbidden: You do not have permission to archive this project"
      );
    }

    // In a real system, you might want to add an 'archived' field instead of deleting
    await prisma.project.delete({
      where: { id },
    });

    return true;
  }
}

export default new ProjectService();
