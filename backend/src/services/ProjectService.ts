import prisma from "../db/prisma";
import {
  CreateProjectDTO,
  UpdateProjectDTO,
  Project,
} from "../types/interfaces";
import { UserRole, WorkflowType, ProjectRole, Permission } from "@prisma/client";
import PermissionService from "./PermissionService";
import emailService from "./EmailService";

type MemberInput = { userId: string } | { id: string } | string;

function getMemberId(member: MemberInput): string | undefined {
  if (typeof member === "string") return member;
  if ("userId" in member) return member.userId;
  if ("id" in member) return member.id;
  return undefined;
}

function normalizeProjectKey(input: string): string {
  return input.trim();
}

function buildBaseProjectKey(name: string): string {
  const cleaned = name.trim();
  return cleaned.length > 0 ? cleaned : "Project";
}

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

    const workflowType = WorkflowType.BASIC;

    // Extract members array if provided
    const membersInput = data.members || [];
    const memberIds = membersInput
      .map((member) => getMemberId(member as MemberInput))
      .filter((id): id is string => Boolean(id));

    if (membersInput.length > 0 && memberIds.length === 0) {
      throw new Error("Member userId is required");
    }

    const uniqueMemberIds = Array.from(new Set(memberIds));

    const normalizedKey = data.key ? normalizeProjectKey(data.key) : "";
    const baseKey = normalizedKey || buildBaseProjectKey(data.name);
    const projectKey = await this.ensureUniqueProjectKey(baseKey);

    const project = await prisma.project.create({
      data: {
        name: data.name,
        key: projectKey,
        description: data.description || null,
        dueDate: data.dueDate || null,
        workflowType,
        workflowSchemeId: null,
        creatorId,
      },
    });

    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true, name: true, email: true },
    });
    const addedByName = creator?.name || "Project Admin";

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
    if (uniqueMemberIds.length > 0) {
      await prisma.projectMember.createMany({
        data: uniqueMemberIds.map((userId) => ({
          projectId: project.id,
          userId,
          role: ProjectRole.DEVELOPER,
          addedById: creatorId,
        })),
        skipDuplicates: true, // Skip if creator is in members array
      });

      const members = await prisma.user.findMany({
        where: { id: { in: uniqueMemberIds } },
        select: { id: true, name: true, email: true },
      });

      const addedAt = new Date().toISOString();
      for (const member of members) {
        if (!member.email || member.id === creatorId) {
          continue;
        }
        emailService
          .sendProjectMemberAddedEmail(member.email, {
            userName: member.name,
            projectName: project.name,
            projectId: project.id,
            addedBy: addedByName,
            addedAt,
          })
          .catch((err) =>
            console.error("Failed to send project member email:", err),
          );
      }
    }

    return project as Project;
  }

  private async ensureUniqueProjectKey(baseKey: string): Promise<string> {
    const trimmedBase = baseKey.trim();
    const safeBase = trimmedBase.length > 0 ? trimmedBase : "Project";
    let candidate = safeBase;
    let suffix = 1;

    while (true) {
      const existing = await prisma.project.findUnique({
        where: { key: candidate },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }

      candidate = `${safeBase}-${suffix}`;
      suffix += 1;

      if (suffix > 9999) {
        throw new Error("Unable to generate unique project key");
      }
    }
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

    const canEdit = await PermissionService.hasProjectPermission(
      userId,
      id,
      Permission.EDIT_PROJECT
    );

    if (!canEdit) {
      throw new Error(
        "Forbidden: You do not have permission to update this project"
      );
    }

    // Update project basic info
    await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        dueDate: data.dueDate,
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

    const membersToAdd = [
      ...(data.addMembers || []),
      ...(data.members || []),
    ];
    const memberIdsToAdd = membersToAdd
      .map((member) => getMemberId(member as MemberInput))
      .filter((id): id is string => Boolean(id));

    if (membersToAdd.length > 0 && memberIdsToAdd.length === 0) {
      throw new Error("Member userId is required");
    }

    const uniqueMemberIdsToAdd = Array.from(new Set(memberIdsToAdd));

    // Handle adding new members
    if (uniqueMemberIdsToAdd.length > 0) {
      // Verify all users exist
      const userIds = uniqueMemberIdsToAdd;
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
      });

      if (users.length !== userIds.length) {
        throw new Error("One or more users not found");
      }

      // Add members (skip duplicates)
      await prisma.projectMember.createMany({
        data: uniqueMemberIdsToAdd.map((memberId) => ({
          projectId: id,
          userId: memberId,
          role: ProjectRole.DEVELOPER,
          addedById: userId,
        })),
        skipDuplicates: true,
      });

      const addedBy = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const addedByName = addedBy?.name || "Project Admin";

      const members = await prisma.user.findMany({
        where: { id: { in: uniqueMemberIdsToAdd } },
        select: { id: true, name: true, email: true },
      });

      const addedAt = new Date().toISOString();
      for (const member of members) {
        if (!member.email || member.id === userId) {
          continue;
        }
        emailService
          .sendProjectMemberAddedEmail(member.email, {
            userName: member.name,
            projectName: project.name,
            projectId: project.id,
            addedBy: addedByName,
            addedAt,
          })
          .catch((err) =>
            console.error("Failed to send project member email:", err),
          );
      }
    }

    // Handle removing members
    if (data.removeMembers && data.removeMembers.length > 0) {
      // Don't allow removing the creator
      if (data.removeMembers.includes(project.creatorId)) {
        throw new Error("Cannot remove project creator from project");
      }

      await prisma.projectMember.deleteMany({
        where: {
          projectId: id,
          userId: { in: data.removeMembers },
        },
      });
    }

    const updatedProject = await prisma.project.findUnique({
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return updatedProject as any;
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
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
