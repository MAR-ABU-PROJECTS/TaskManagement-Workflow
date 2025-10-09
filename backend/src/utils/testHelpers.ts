import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

/**
 * Generate a test JWT token for authentication in tests
 */
export function generateTestToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h'
  });
}

/**
 * Create test user data
 */
export function createTestUserData(overrides: Partial<User> = {}): Partial<User> {
  return {
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    role: 'DEVELOPER',
    isActive: true,
    ...overrides
  };
}

/**
 * Create test project data
 */
export function createTestProjectData(ownerId: string, overrides: any = {}): any {
  return {
    name: 'Test Project',
    key: 'TEST',
    description: 'A test project',
    methodology: 'AGILE',
    status: 'ACTIVE',
    ownerId,
    ...overrides
  };
}

/**
 * Create test task data
 */
export function createTestTaskData(projectId: string, reporterId: string, overrides: any = {}): any {
  return {
    key: 'TEST-1',
    title: 'Test Task',
    description: 'A test task',
    type: 'STORY',
    status: 'TODO',
    priority: 'MEDIUM',
    reporterId,
    projectId,
    ...overrides
  };
}

/**
 * Create test epic data
 */
export function createTestEpicData(projectId: string, ownerId: string, overrides: any = {}): any {
  return {
    title: 'Test Epic',
    description: 'A test epic',
    projectId,
    priority: 'HIGH',
    ownerId,
    businessValue: 1000,
    color: '#FF5722',
    labels: ['test'],
    ...overrides
  };
}

/**
 * Create test backlog item data
 */
export function createTestBacklogItemData(taskId: string, overrides: any = {}): any {
  return {
    taskId,
    storyPoints: 5,
    businessValue: 100,
    riskLevel: 'MEDIUM',
    acceptanceCriteria: ['Test criteria'],
    dependencies: [],
    ...overrides
  };
}

/**
 * Wait for a specified amount of time (useful for async operations in tests)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a unique test identifier
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clean up test data from database
 */
export async function cleanupTestData(prisma: any, entities: string[] = []): Promise<void> {
  const defaultEntities = [
    'backlogItem',
    'epic', 
    'task',
    'project',
    'user'
  ];

  const entitiesToClean = entities.length > 0 ? entities : defaultEntities;

  for (const entity of entitiesToClean) {
    try {
      await prisma[entity].deleteMany({});
    } catch (error) {
      console.warn(`Failed to clean up ${entity}:`, error);
    }
  }
}