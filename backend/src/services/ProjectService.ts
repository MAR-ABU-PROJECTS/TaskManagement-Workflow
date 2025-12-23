import prisma from "../db/prisma";
import {
  CreateProjectDTO,
  UpdateProjectDTO,
  Project,
} from "../types/interfaces";
import { UserRole, WorkflowType, ProjectRole } from "@prisma/client";

export class ProjectService {
  /**
   * Create a new project
   */
  async createProject(
    data: CreateProjectDTO,
    creatorId: string,
    creatorRole: UserRole
  ): Promise<Project> {
    // Validate creator has permission to create projects
    const allowedRoles = [
      UserRole.CEO,
      UserRole.HOO,
      UserRole.HR,
      UserRole.ADMIN,
    ];
    if (!allowedRoles.includes(creatorRole as any)) {
      throw new Error(
        "Forbidden: Only CEO, HOO, HR, and ADMIN can create projects"
      );
    }

    // Extract members array if provided
    const members = data.members || [];

    const project = await prisma.project.create({
      data: {
        name: data.name,
        key: data.key,
        description: data.description || null,
        workflowType: (data.workflowType as WorkflowType) || WorkflowType.BASIC,
        workflowSchemeId: data.workflowSchemeId || null,
        creatorId,
      },
    });

    // Auto-assign creator as PROJECT_ADMIN (all creators get admin role)
    const projectRole = ProjectRole.PROJECT_ADMIN;

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: creatorId,
        role: projectRole,
        addedById: creatorId,
      },
    });

    // Add additional members if provided (all auto-assigned as DEVELOPER)
    if (members.length > 0) {
      await prisma.projectMember.createMany({
        data: members.map((member) => ({
          projectId: project.id,
          userId: member.userId,
          role: ProjectRole.DEVELOPER,
          addedById: creatorId,
        })),
        skipDuplicates: true, // Skip if creator is in members array
      });
    }

    return project as Project;
  }

  /**
   * Get all projects with optional filtering
   */
  async getAllProjects(userId: string, userRole: UserRole): Promise<Project[]> {
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

    // HOO and HR see only ADMIN and STAFF projects (not CEO projects)
    // Unless they are explicitly added as members to CEO projects
    if (userRole === UserRole.HOO || userRole === UserRole.HR) {
      return (await prisma.project.findMany({
        where: {
          OR: [
            // Projects created by ADMIN or STAFF
            {
              creator: {
                role: {
                  in: [UserRole.ADMIN, UserRole.STAFF],
                },
              },
            },
            // Projects where they are explicitly added as members
            { members: { some: { userId } } },
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

    // SUPER_ADMIN sees all projects for audit
    if (userRole === UserRole.SUPER_ADMIN) {
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

    // Admin and Staff see only projects they are members of or created
    return (await prisma.project.findMany({
      where: {
        OR: [{ creatorId: userId }, { members: { some: { userId } } }],
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
   * Update project
   */
  async updateProject(
    id: string,
    data: UpdateProjectDTO,
    userId: string,
    _userRole: UserRole
  ): Promise<Project | null> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Check permission: only creator can update project
    const isCreator = project.creatorId === userId;

    if (!isCreator) {
      throw new Error(
        "Forbidden: Only the project creator can update this project"
      );
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        workflowType: data.workflowType as any,
        workflowSchemeId: data.workflowSchemeId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return updated as Project;
  }

  /**
   * Add member to project
   */
  async addMember(
    projectId: string,
    userIdToAdd: string,
    requesterId: string,
    requesterRole: UserRole
  ): Promise<any> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Check permission
    const isCreator = project.creatorId === requesterId;
    const isProjectAdmin = project.members.some(
      (m) => m.userId === requesterId && m.role === "PROJECT_ADMIN"
    );
    const isManagement = [
      UserRole.CEO,
      UserRole.HOO,
      UserRole.HR,
      UserRole.ADMIN,
    ].includes(requesterRole as any);

    if (!isCreator && !isProjectAdmin && !isManagement) {
      throw new Error("Forbidden: You do not have permission to add members");
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userIdToAdd },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already a member
    const existingMember = project.members.find(
      (m) => m.userId === userIdToAdd
    );

    if (existingMember) {
      throw new Error("User is already a project member");
    }

    // All added members are DEVELOPER role only
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: userIdToAdd,
        role: ProjectRole.DEVELOPER,
        addedById: requesterId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return member;
  }

  /**
   * Update member role in project
   */
  async updateMemberRole(
    projectId: string,
    userIdToUpdate: string,
    requesterId: string,
    requesterRole: UserRole
  ): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Check permission
    const isCreator = project.creatorId === requesterId;
    const isProjectAdmin = project.members.some(
      (m) => m.userId === requesterId && m.role === "PROJECT_ADMIN"
    );
    const isManagement = [
      UserRole.CEO,
      UserRole.HOO,
      UserRole.HR,
      UserRole.ADMIN,
    ].includes(requesterRole as any);

    if (!isCreator && !isProjectAdmin && !isManagement) {
      throw new Error(
        "Forbidden: You do not have permission to update member roles"
      );
    }

    // Check if user is a member
    const member = project.members.find((m) => m.userId === userIdToUpdate);
    if (!member) {
      throw new Error("User is not a project member");
    }

    // Cannot change creator's role
    if (userIdToUpdate === project.creatorId) {
      throw new Error("Cannot change project creator's role");
    }

    // Cannot change roles - only PROJECT_ADMIN (creator) and DEVELOPER roles exist
    // All non-creator members must be DEVELOPER
    throw new Error(
      "Role updates are not allowed. Only project creator has PROJECT_ADMIN role. All other members are DEVELOPER."
    );
  }

  /**
   * Remove member from project
   */
  async removeMember(
    projectId: string,
    memberUserId: string,
    requesterId: string,
    requesterRole: UserRole
  ): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Check permission
    const isCreator = project.creatorId === requesterId;
    const isProjectAdmin = project.members.some(
      (m) => m.userId === requesterId && m.role === "PROJECT_ADMIN"
    );
    const isManagement = [
      UserRole.CEO,
      UserRole.HOO,
      UserRole.HR,
      UserRole.ADMIN,
    ].includes(requesterRole as any);

    if (!isCreator && !isProjectAdmin && !isManagement) {
      throw new Error(
        "Forbidden: You do not have permission to remove members"
      );
    }

    // Cannot remove project creator
    if (memberUserId === project.creatorId) {
      throw new Error("Cannot remove project creator");
    }

    await prisma.projectMember.deleteMany({
      where: {
        projectId,
        userId: memberUserId,
      },
    });
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
            assignees: { select: { userId: true } },
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      return null;
    }

    // Check access permissions - hierarchical visibility
    const isMember = await prisma.projectMember.findFirst({
      where: { projectId: id, userId },
    });

    // Get creator's role for hierarchical checks
    const creator = await prisma.user.findUnique({
      where: { id: project.creatorId },
      select: { role: true },
    });

    let hasAccess = false;

    if (userRole === UserRole.SUPER_ADMIN) {
      // SUPER_ADMIN sees everything for audit
      hasAccess = true;
    } else if (userRole === UserRole.CEO) {
      // CEO sees all projects
      hasAccess = true;
    } else if (userRole === UserRole.HOO || userRole === UserRole.HR) {
      // HOO/HR can see ADMIN and STAFF projects, or if they're members
      hasAccess =
        creator?.role === UserRole.ADMIN ||
        creator?.role === UserRole.STAFF ||
        isMember !== null;
    } else {
      // ADMIN/STAFF can only see if they're creator or member
      hasAccess = project.creatorId === userId || isMember !== null;
    }

    if (!hasAccess) {
      return null;
    }

    return project as any;
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

    // Only CEO, HOO, HR, ADMIN, or creator can archive
    const canArchive =
      userRole === UserRole.CEO ||
      userRole === UserRole.HOO ||
      userRole === UserRole.HR ||
      userRole === UserRole.ADMIN ||
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
