import { Request, Response } from "express";
import ProjectService from "../services/ProjectService";
import { CreateProjectDTO, UpdateProjectDTO } from "../types/interfaces";
import { UserRole } from "../types/enums";

export class ProjectController {
  /**
   * POST /projects - Create a new project
   */
  async createProject(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const data: CreateProjectDTO = req.body;

      if (!data.name) {
        return res.status(400).json({ message: "Project name is required" });
      }

      const project = await ProjectService.createProject(
        data,
        req.user.id,
        req.user.role as UserRole
      );

      return res.status(201).json({
        message: "Project created successfully",
        data: project,
      });
    } catch (error: any) {
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to create project",
        error: error.message,
      });
    }
  }

  /**
   * GET /projects - List all projects
   */
  async getAllProjects(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const projects = await ProjectService.getAllProjects(
        req.user.id,
        req.user.role as UserRole
      );

      return res.status(200).json({
        message: "Projects retrieved successfully",
        data: projects,
        count: projects.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve projects",
        error: error.message,
      });
    }
  }

  /**
   * GET /projects/:id - Get project by ID
   */
  async getProjectById(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      const project = await ProjectService.getProjectById(
        id,
        req.user.id,
        req.user.role as UserRole
      );

      if (!project) {
        return res
          .status(404)
          .json({ message: "Project not found or access denied" });
      }

      return res.status(200).json({
        message: "Project retrieved successfully",
        data: project,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to retrieve project",
        error: error.message,
      });
    }
  }

  /**
   * PATCH /projects/:id - Update project
   */
  async updateProject(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      const data: UpdateProjectDTO = req.body;

      const project = await ProjectService.updateProject(
        id,
        data,
        req.user.id,
        req.user.role as UserRole
      );

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      return res.status(200).json({
        message: "Project updated successfully",
        data: project,
      });
    } catch (error: any) {
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to update project",
        error: error.message,
      });
    }
  }

  /**
   * DELETE /projects/:id - Archive project
   */
  async archiveProject(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      const success = await ProjectService.archiveProject(
        id,
        req.user.id,
        req.user.role as UserRole
      );

      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }

      return res.status(200).json({
        message: "Project archived successfully",
      });
    } catch (error: any) {
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to archive project",
        error: error.message,
      });
    }
  }

  /**
   * POST /projects/:projectId/members - Add project member
   */
  async addMember(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { projectId } = req.params;
      const { userId } = req.body;

      if (!projectId || !userId) {
        return res
          .status(400)
          .json({ message: "Project ID and User ID are required" });
      }

      const member = await ProjectService.addMember(
        projectId,
        userId,
        req.user.id,
        req.user.role as UserRole
      );

      return res.status(201).json({
        message: "Member added successfully",
        data: member,
      });
    } catch (error: any) {
      if (
        error.message.includes("Forbidden") ||
        error.message.includes("already a project member")
      ) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to add member",
        error: error.message,
      });
    }
  }

  /**
   * PATCH /projects/:projectId/members/:userId - Update member role
   */
  async updateMemberRole(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { projectId, userId } = req.params;

      if (!projectId || !userId) {
        return res
          .status(400)
          .json({ message: "Project ID and User ID are required" });
      }

      await ProjectService.updateMemberRole(
        projectId,
        userId,
        req.user.id,
        req.user.role as UserRole
      );

      return res.status(200).json({
        message: "Member role updated successfully",
      });
    } catch (error: any) {
      if (
        error.message.includes("Forbidden") ||
        error.message.includes("Cannot change")
      ) {
        return res.status(403).json({ message: error.message });
      }
      if (
        error.message.includes("not found") ||
        error.message.includes("not a project member")
      ) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to update member role",
        error: error.message,
      });
    }
  }

  /**
   * DELETE /projects/:projectId/members/:userId - Remove project member
   */
  async removeMember(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res
          .status(403)
          .json({ message: "Forbidden: Authentication required" });
      }

      const { projectId, userId } = req.params;
      if (!projectId || !userId) {
        return res
          .status(400)
          .json({ message: "Project ID and User ID are required" });
      }

      await ProjectService.removeMember(
        projectId,
        userId,
        req.user.id,
        req.user.role as UserRole
      );

      return res.status(200).json({
        message: "Member removed successfully",
      });
    } catch (error: any) {
      if (
        error.message.includes("Forbidden") ||
        error.message.includes("Cannot remove")
      ) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({
        message: "Failed to remove member",
        error: error.message,
      });
    }
  }
}

export default new ProjectController();
