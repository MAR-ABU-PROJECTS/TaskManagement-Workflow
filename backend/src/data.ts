import { v4 as uuidv4 } from "uuid";
import { UserRole, Department } from "./types/enums";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  department: Department | null;
  isActive: boolean;
  createdAt: Date;
}

// In‑memory arrays (for backward compatibility, but should use Prisma in production)
export const users: User[] = [];

// Helper functions to create IDs
export function generateId(): string {
  return uuidv4();
}
