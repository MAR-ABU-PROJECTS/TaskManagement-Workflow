import { PrismaClient, UserRole, ProjectMethodology, ProjectStatus, Priority, TaskType, SprintStatus, StatusCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seeding...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@marabuprojects.com' },
      update: {},
      create: {
        email: 'admin@marabuprojects.com',
        passwordHash: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    logger.info(`Created admin user: ${admin.email}`);

    // Create project manager
    const pmPassword = await bcrypt.hash('Manager123!', 12);
    const projectManager = await prisma.user.upsert({
      where: { email: 'pm@marabuprojects.com' },
      update: {},
      create: {
        email: 'pm@marabuprojects.com',
        passwordHash: pmPassword,
        firstName: 'Project',
        lastName: 'Manager',
        role: UserRole.PROJECT_MANAGER,
        isActive: true,
      },
    });
    logger.info(`Created project manager: ${projectManager.email}`);

    // Create team lead
    const tlPassword = await bcrypt.hash('Lead123!', 12);
    const teamLead = await prisma.user.upsert({
      where: { email: 'lead@marabuprojects.com' },
      update: {},
      create: {
        email: 'lead@marabuprojects.com',
        passwordHash: tlPassword,
        firstName: 'Team',
        lastName: 'Lead',
        role: UserRole.TEAM_LEAD,
        isActive: true,
      },
    });
    logger.info(`Created team lead: ${teamLead.email}`);

    // Create developers
    const dev1Password = await bcrypt.hash('Dev123!', 12);
    const developer1 = await prisma.user.upsert({
      where: { email: 'dev1@marabuprojects.com' },
      update: {},
      create: {
        email: 'dev1@marabuprojects.com',
        passwordHash: dev1Password,
        firstName: 'John',
        lastName: 'Developer',
        role: UserRole.DEVELOPER,
        isActive: true,
      },
    });

    const dev2Password = await bcrypt.hash('Dev123!', 12);
    const developer2 = await prisma.user.upsert({
      where: { email: 'dev2@marabuprojects.com' },
      update: {},
      create: {
        email: 'dev2@marabuprojects.com',
        passwordHash: dev2Password,
        firstName: 'Jane',
        lastName: 'Developer',
        role: UserRole.DEVELOPER,
        isActive: true,
      },
    });
    logger.info('Created developers');

    // Create sample project
    const sampleProject = await prisma.project.upsert({
      where: { key: 'MAR-001' },
      update: {},
      create: {
        name: 'MAR ABU Project Management System',
        description: 'Enterprise-grade project and task management application',
        key: 'MAR-001',
        methodology: ProjectMethodology.AGILE,
        status: ProjectStatus.ACTIVE,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        budget: 100000.00,
        priority: Priority.HIGH,
        ownerId: projectManager.id,
      },
    });
    logger.info(`Created sample project: ${sampleProject.name}`);

    // Create default workflow for the project
    const defaultWorkflow = await prisma.workflow.create({
      data: {
        name: 'Default Workflow',
        projectId: sampleProject.id,
        isDefault: true,
        statuses: {
          create: [
            {
              name: 'To Do',
              category: StatusCategory.TODO,
              order: 1,
              color: '#DDD',
            },
            {
              name: 'In Progress',
              category: StatusCategory.IN_PROGRESS,
              order: 2,
              color: '#FFA500',
            },
            {
              name: 'In Review',
              category: StatusCategory.IN_PROGRESS,
              order: 3,
              color: '#FFD700',
            },
            {
              name: 'Done',
              category: StatusCategory.DONE,
              order: 4,
              color: '#32CD32',
            },
          ],
        },
      },
      include: {
        statuses: true,
      },
    });
    logger.info(`Created default workflow with ${defaultWorkflow.statuses.length} statuses`);

    // Create workflow transitions
    const statuses = defaultWorkflow.statuses;
    const transitions = [
      { from: 'To Do', to: 'In Progress', name: 'Start Work' },
      { from: 'In Progress', to: 'In Review', name: 'Submit for Review' },
      { from: 'In Review', to: 'Done', name: 'Approve' },
      { from: 'In Review', to: 'In Progress', name: 'Request Changes' },
      { from: 'In Progress', to: 'To Do', name: 'Stop Work' },
    ];

    for (const transition of transitions) {
      const fromStatus = statuses.find(s => s.name === transition.from);
      const toStatus = statuses.find(s => s.name === transition.to);
      
      if (fromStatus && toStatus) {
        await prisma.workflowTransition.create({
          data: {
            workflowId: defaultWorkflow.id,
            fromStatusId: fromStatus.id,
            toStatusId: toStatus.id,
            name: transition.name,
          },
        });
      }
    }
    logger.info('Created workflow transitions');

    // Add project members
    await prisma.projectMember.createMany({
      data: [
        {
          projectId: sampleProject.id,
          userId: teamLead.id,
          role: 'MANAGER',
          permissions: ['read', 'write', 'delete'],
        },
        {
          projectId: sampleProject.id,
          userId: developer1.id,
          role: 'DEVELOPER',
          permissions: ['read', 'write'],
        },
        {
          projectId: sampleProject.id,
          userId: developer2.id,
          role: 'DEVELOPER',
          permissions: ['read', 'write'],
        },
      ],
      skipDuplicates: true,
    });
    logger.info('Added project members');

    // Create sample tasks
    const todoStatus = statuses.find(s => s.name === 'To Do');
    const inProgressStatus = statuses.find(s => s.name === 'In Progress');
    const doneStatus = statuses.find(s => s.name === 'Done');

    if (todoStatus && inProgressStatus && doneStatus) {
      // Epic task
      const epic = await prisma.task.create({
        data: {
          key: 'MAR-1',
          title: 'User Management System',
          description: 'Implement comprehensive user management with authentication and authorization',
          type: TaskType.EPIC,
          statusId: inProgressStatus.id,
          priority: Priority.HIGH,
          reporterId: projectManager.id,
          assigneeId: teamLead.id,
          projectId: sampleProject.id,
          estimatedHours: 80,
          remainingHours: 40,
          storyPoints: 21,
          labels: ['backend', 'security'],
          components: ['authentication', 'authorization'],
        },
      });

      // Story tasks
      const story1 = await prisma.task.create({
        data: {
          key: 'MAR-2',
          title: 'User Registration and Login',
          description: 'Implement user registration and login functionality with JWT authentication',
          type: TaskType.STORY,
          statusId: doneStatus.id,
          priority: Priority.HIGH,
          reporterId: teamLead.id,
          assigneeId: developer1.id,
          projectId: sampleProject.id,
          parentId: epic.id,
          estimatedHours: 16,
          remainingHours: 0,
          loggedHours: 18,
          storyPoints: 8,
          labels: ['backend', 'authentication'],
          components: ['auth-service'],
        },
      });

      const story2 = await prisma.task.create({
        data: {
          key: 'MAR-3',
          title: 'Role-Based Access Control',
          description: 'Implement RBAC system with permissions management',
          type: TaskType.STORY,
          statusId: inProgressStatus.id,
          priority: Priority.HIGH,
          reporterId: teamLead.id,
          assigneeId: developer2.id,
          projectId: sampleProject.id,
          parentId: epic.id,
          estimatedHours: 24,
          remainingHours: 12,
          loggedHours: 12,
          storyPoints: 13,
          labels: ['backend', 'authorization'],
          components: ['auth-service', 'user-service'],
        },
      });

      // Bug task
      await prisma.task.create({
        data: {
          key: 'MAR-4',
          title: 'Fix password reset email not sending',
          description: 'Password reset emails are not being sent to users',
          type: TaskType.BUG,
          statusId: todoStatus.id,
          priority: Priority.MEDIUM,
          reporterId: developer1.id,
          assigneeId: developer2.id,
          projectId: sampleProject.id,
          estimatedHours: 4,
          remainingHours: 4,
          storyPoints: 3,
          labels: ['bug', 'email'],
          components: ['notification-service'],
        },
      });

      logger.info('Created sample tasks');

      // Create sample comments
      await prisma.comment.createMany({
        data: [
          {
            taskId: story1.id,
            authorId: developer1.id,
            content: 'Completed the JWT implementation. Ready for review.',
          },
          {
            taskId: story2.id,
            authorId: developer2.id,
            content: 'Working on the permission matrix. Should be done by EOD.',
          },
          {
            taskId: story2.id,
            authorId: teamLead.id,
            content: 'Great progress! Let me know if you need any help with the complex permissions.',
          },
        ],
      });
      logger.info('Created sample comments');

      // Create time entries
      await prisma.timeEntry.createMany({
        data: [
          {
            taskId: story1.id,
            userId: developer1.id,
            hours: 8,
            description: 'Implemented JWT authentication',
            date: new Date('2024-01-15'),
          },
          {
            taskId: story1.id,
            userId: developer1.id,
            hours: 6,
            description: 'Added password validation and hashing',
            date: new Date('2024-01-16'),
          },
          {
            taskId: story1.id,
            userId: developer1.id,
            hours: 4,
            description: 'Testing and bug fixes',
            date: new Date('2024-01-17'),
          },
          {
            taskId: story2.id,
            userId: developer2.id,
            hours: 6,
            description: 'Designed RBAC schema',
            date: new Date('2024-01-18'),
          },
          {
            taskId: story2.id,
            userId: developer2.id,
            hours: 6,
            description: 'Implemented role management',
            date: new Date('2024-01-19'),
          },
        ],
      });
      logger.info('Created sample time entries');

      // Create a sprint
      const sprint = await prisma.sprint.create({
        data: {
          name: 'Sprint 1 - Foundation',
          goal: 'Establish core user management and authentication system',
          projectId: sampleProject.id,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-29'),
          status: SprintStatus.ACTIVE,
          capacity: 80,
          velocity: 21,
        },
      });

      // Add tasks to sprint
      await prisma.sprintTask.createMany({
        data: [
          { sprintId: sprint.id, taskId: story1.id },
          { sprintId: sprint.id, taskId: story2.id },
        ],
      });
      logger.info('Created sample sprint with tasks');

      // Create backlog
      await prisma.backlog.create({
        data: {
          projectId: sampleProject.id,
          priorityOrder: [epic.id, story2.id],
        },
      });
      logger.info('Created project backlog');
    }

    // Create custom fields
    await prisma.customField.createMany({
      data: [
        {
          projectId: sampleProject.id,
          name: 'Business Value',
          type: 'SELECT',
          options: ['Low', 'Medium', 'High', 'Critical'],
          isRequired: false,
          order: 1,
        },
        {
          projectId: sampleProject.id,
          name: 'Technical Complexity',
          type: 'SELECT',
          options: ['Simple', 'Moderate', 'Complex', 'Very Complex'],
          isRequired: false,
          order: 2,
        },
        {
          projectId: sampleProject.id,
          name: 'Testing Notes',
          type: 'TEXT',
          options: [],
          isRequired: false,
          order: 3,
        },
      ],
    });
    logger.info('Created custom fields');

    logger.info('Database seeding completed successfully!');
    
    // Log summary
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const taskCount = await prisma.task.count();
    
    logger.info(`Summary: ${userCount} users, ${projectCount} projects, ${taskCount} tasks created`);

  } catch (error) {
    logger.error('Error during database seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });