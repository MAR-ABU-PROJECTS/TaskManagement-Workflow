import { PrismaClient } from '@prisma/client';
import { UserModel } from './UserModel';
import { TeamModel } from './TeamModel';
import { ProjectModel } from './ProjectModel';

// Model factory to create model instances
export class ModelFactory {
  private prisma: PrismaClient;
  private userModel?: UserModel;
  private teamModel?: TeamModel;
  private projectModel?: ProjectModel;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  get user(): UserModel {
    if (!this.userModel) {
      this.userModel = new UserModel(this.prisma);
    }
    return this.userModel;
  }

  get team(): TeamModel {
    if (!this.teamModel) {
      this.teamModel = new TeamModel(this.prisma);
    }
    return this.teamModel;
  }

  get project(): ProjectModel {
    if (!this.projectModel) {
      this.projectModel = new ProjectModel(this.prisma);
    }
    return this.projectModel;
  }
}

// Export individual models
export { UserModel } from './UserModel';
export { TeamModel } from './TeamModel';
export { ProjectModel } from './ProjectModel';
export { BaseModel } from './BaseModel';