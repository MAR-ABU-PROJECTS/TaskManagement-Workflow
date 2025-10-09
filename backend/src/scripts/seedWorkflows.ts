import { PrismaClient } from '@prisma/client';
import { WorkflowService } from '../services/WorkflowService';
import { ProjectConfigurationService } from '../services/ProjectConfigurationService';
import { defaultWorkflows, defaultProjectTemplates } from '../data/defaultWorkflows';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const workflowService = new WorkflowService();
const configService = new ProjectConfigurationService();

async function seedWorkflows() {
  try {
    logger.info('Starting workflow seeding...');

    // Create system user for seeding
    let systemUser = await prisma.user.findUnique({
      where: { email: 'system@taskmanagement.com' }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@taskmanagement.com',
          passwordHash: 'system-user-no-login',
          firstName: 'System',
          lastName: 'User',
          role: 'ADMIN',
          isActive: false // System user should not be able to login
        }
      });
      logger.info('Created system user for seeding');
    }

    // Seed default workflows
    const createdWorkflows = [];
    for (const workflowData of defaultWorkflows) {
      try {
        // Check if workflow already exists
        const existingWorkflows = await workflowService.getWorkflows({
          type: workflowData.type,
          isDefault: true
        }, systemUser.id);

        const exists = existingWorkflows.some(w => w.name === workflowData.name);
        if (exists) {
          logger.info(`Workflow "${workflowData.name}" already exists, skipping...`);
          continue;
        }

        // Generate proper IDs for states and transitions
        const statesWithIds = workflowData.states.map((state, index) => ({
          ...state,
          id: `${workflowData.type.toLowerCase()}-state-${index + 1}`
        }));

        const transitionsWithIds = workflowData.transitions.map((transition, index) => {
          // Map state names to IDs
          const fromState = statesWithIds.find(s => 
            s.name.toLowerCase().replace(/\s+/g, '') === 
            transition.fromStateId.replace('-state', '').replace(/\s+/g, '')
          );
          const toState = statesWithIds.find(s => 
            s.name.toLowerCase().replace(/\s+/g, '') === 
            transition.toStateId.replace('-state', '').replace(/\s+/g, '')
          );

          return {
            ...transition,
            id: `${workflowData.type.toLowerCase()}-transition-${index + 1}`,
            fromStateId: fromState?.id || statesWithIds[0].id,
            toStateId: toState?.id || statesWithIds[1]?.id || statesWithIds[0].id
          };
        });

        const workflow = await workflowService.createWorkflow({
          ...workflowData,
          states: statesWithIds,
          transitions: transitionsWithIds,
          projectId: null // Global workflow
        }, systemUser.id);

        // Activate the workflow
        await workflowService.activateWorkflow(workflow.id, systemUser.id);

        createdWorkflows.push(workflow);
        logger.info(`Created and activated workflow: ${workflow.name}`);
      } catch (error) {
        logger.error(`Error creating workflow "${workflowData.name}":`, error);
      }
    }

    // Seed default project templates
    for (const templateData of defaultProjectTemplates) {
      try {
        // Check if template already exists
        const existingTemplates = await configService.getProjectTemplates({
          category: templateData.category,
          methodology: templateData.methodology
        });

        const exists = existingTemplates.some(t => t.name === templateData.name);
        if (exists) {
          logger.info(`Template "${templateData.name}" already exists, skipping...`);
          continue;
        }

        // Associate relevant workflows with the template
        const relevantWorkflows = createdWorkflows.filter(w => {
          if (templateData.methodology === 'AGILE') {
            return ['TASK', 'STORY', 'BUG', 'EPIC'].includes(w.type);
          } else if (templateData.methodology === 'WATERFALL') {
            return ['TASK', 'BUG'].includes(w.type);
          }
          return false;
        });

        const template = await configService.createProjectTemplate({
          ...templateData,
          workflows: relevantWorkflows.map(w => w.id)
        }, systemUser.id);

        logger.info(`Created project template: ${template.name}`);
      } catch (error) {
        logger.error(`Error creating template "${templateData.name}":`, error);
      }
    }

    logger.info('Workflow seeding completed successfully');
  } catch (error) {
    logger.error('Error during workflow seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedWorkflows()
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedWorkflows };