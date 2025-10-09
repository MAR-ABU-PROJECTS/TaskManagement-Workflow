import { WorkflowType, CreateWorkflowRequest } from '../types/workflow.types';

export const defaultWorkflows: CreateWorkflowRequest[] = [
  {
    name: 'Basic Task Workflow',
    description: 'Simple three-state workflow for general tasks',
    type: WorkflowType.TASK,
    isDefault: true,
    states: [
      {
        name: 'To Do',
        description: 'Tasks that need to be started',
        color: '#6B7280',
        category: 'TODO',
        isInitial: true,
        isFinal: false,
        position: 1
      },
      {
        name: 'In Progress',
        description: 'Tasks currently being worked on',
        color: '#3B82F6',
        category: 'IN_PROGRESS',
        isInitial: false,
        isFinal: false,
        position: 2
      },
      {
        name: 'Done',
        description: 'Completed tasks',
        color: '#10B981',
        category: 'DONE',
        isInitial: false,
        isFinal: true,
        position: 3
      }
    ],
    transitions: [
      {
        name: 'Start Work',
        description: 'Begin working on the task',
        fromStateId: 'todo-state',
        toStateId: 'inprogress-state',
        type: 'MANUAL',
        position: 1,
        allowedRoles: ['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Complete',
        description: 'Mark task as completed',
        fromStateId: 'inprogress-state',
        toStateId: 'done-state',
        type: 'MANUAL',
        position: 2,
        allowedRoles: ['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Reopen',
        description: 'Reopen completed task',
        fromStateId: 'done-state',
        toStateId: 'todo-state',
        type: 'MANUAL',
        position: 3,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN']
      }
    ]
  },
  {
    name: 'Agile Story Workflow',
    description: 'Workflow for user stories in agile development',
    type: WorkflowType.STORY,
    isDefault: true,
    states: [
      {
        name: 'Backlog',
        description: 'Stories in the product backlog',
        color: '#9CA3AF',
        category: 'TODO',
        isInitial: true,
        isFinal: false,
        position: 1
      },
      {
        name: 'Ready',
        description: 'Stories ready for development',
        color: '#F59E0B',
        category: 'TODO',
        isInitial: false,
        isFinal: false,
        position: 2
      },
      {
        name: 'In Development',
        description: 'Stories currently being developed',
        color: '#3B82F6',
        category: 'IN_PROGRESS',
        isInitial: false,
        isFinal: false,
        position: 3
      },
      {
        name: 'In Review',
        description: 'Stories under code review',
        color: '#8B5CF6',
        category: 'IN_PROGRESS',
        isInitial: false,
        isFinal: false,
        position: 4
      },
      {
        name: 'Testing',
        description: 'Stories being tested',
        color: '#F97316',
        category: 'IN_PROGRESS',
        isInitial: false,
        isFinal: false,
        position: 5
      },
      {
        name: 'Done',
        description: 'Completed and accepted stories',
        color: '#10B981',
        category: 'DONE',
        isInitial: false,
        isFinal: true,
        position: 6
      }
    ],
    transitions: [
      {
        name: 'Make Ready',
        description: 'Mark story as ready for development',
        fromStateId: 'backlog-state',
        toStateId: 'ready-state',
        type: 'MANUAL',
        position: 1,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Start Development',
        description: 'Begin development work',
        fromStateId: 'ready-state',
        toStateId: 'development-state',
        type: 'MANUAL',
        position: 2,
        allowedRoles: ['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Submit for Review',
        description: 'Submit for code review',
        fromStateId: 'development-state',
        toStateId: 'review-state',
        type: 'MANUAL',
        position: 3,
        allowedRoles: ['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Send to Testing',
        description: 'Send to testing team',
        fromStateId: 'review-state',
        toStateId: 'testing-state',
        type: 'MANUAL',
        position: 4,
        allowedRoles: ['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Accept',
        description: 'Accept completed story',
        fromStateId: 'testing-state',
        toStateId: 'done-state',
        type: 'MANUAL',
        position: 5,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN', 'TESTER']
      },
      {
        name: 'Reject',
        description: 'Reject and send back to development',
        fromStateId: 'testing-state',
        toStateId: 'development-state',
        type: 'MANUAL',
        position: 6,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN', 'TESTER']
      }
    ]
  },
  {
    name: 'Bug Tracking Workflow',
    description: 'Workflow for tracking and resolving bugs',
    type: WorkflowType.BUG,
    isDefault: true,
    states: [
      {
        name: 'Open',
        description: 'Newly reported bugs',
        color: '#EF4444',
        category: 'TODO',
        isInitial: true,
        isFinal: false,
        position: 1
      },
      {
        name: 'Triaged',
        description: 'Bugs that have been triaged and prioritized',
        color: '#F59E0B',
        category: 'TODO',
        isInitial: false,
        isFinal: false,
        position: 2
      },
      {
        name: 'In Progress',
        description: 'Bugs currently being fixed',
        color: '#3B82F6',
        category: 'IN_PROGRESS',
        isInitial: false,
        isFinal: false,
        position: 3
      },
      {
        name: 'Fixed',
        description: 'Bugs that have been fixed',
        color: '#8B5CF6',
        category: 'IN_PROGRESS',
        isInitial: false,
        isFinal: false,
        position: 4
      },
      {
        name: 'Verified',
        description: 'Fixed bugs that have been verified',
        color: '#10B981',
        category: 'DONE',
        isInitial: false,
        isFinal: true,
        position: 5
      },
      {
        name: 'Closed',
        description: 'Resolved and closed bugs',
        color: '#6B7280',
        category: 'DONE',
        isInitial: false,
        isFinal: true,
        position: 6
      },
      {
        name: 'Rejected',
        description: 'Bugs that are not valid or will not be fixed',
        color: '#9CA3AF',
        category: 'DONE',
        isInitial: false,
        isFinal: true,
        position: 7
      }
    ],
    transitions: [
      {
        name: 'Triage',
        description: 'Triage and prioritize the bug',
        fromStateId: 'open-state',
        toStateId: 'triaged-state',
        type: 'MANUAL',
        position: 1,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN', 'TESTER']
      },
      {
        name: 'Start Fix',
        description: 'Begin fixing the bug',
        fromStateId: 'triaged-state',
        toStateId: 'inprogress-state',
        type: 'MANUAL',
        position: 2,
        allowedRoles: ['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Mark Fixed',
        description: 'Mark bug as fixed',
        fromStateId: 'inprogress-state',
        toStateId: 'fixed-state',
        type: 'MANUAL',
        position: 3,
        allowedRoles: ['DEVELOPER', 'PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Verify Fix',
        description: 'Verify the bug fix',
        fromStateId: 'fixed-state',
        toStateId: 'verified-state',
        type: 'MANUAL',
        position: 4,
        allowedRoles: ['TESTER', 'PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Close',
        description: 'Close the verified bug',
        fromStateId: 'verified-state',
        toStateId: 'closed-state',
        type: 'MANUAL',
        position: 5,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Reject',
        description: 'Reject the bug report',
        fromStateId: 'open-state',
        toStateId: 'rejected-state',
        type: 'MANUAL',
        position: 6,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Reopen',
        description: 'Reopen a closed bug',
        fromStateId: 'closed-state',
        toStateId: 'open-state',
        type: 'MANUAL',
        position: 7,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN', 'TESTER']
      }
    ]
  },
  {
    name: 'Epic Workflow',
    description: 'High-level workflow for managing epics',
    type: WorkflowType.EPIC,
    isDefault: true,
    states: [
      {
        name: 'Idea',
        description: 'Epic ideas and concepts',
        color: '#9CA3AF',
        category: 'TODO',
        isInitial: true,
        isFinal: false,
        position: 1
      },
      {
        name: 'Planning',
        description: 'Epics being planned and broken down',
        color: '#F59E0B',
        category: 'TODO',
        isInitial: false,
        isFinal: false,
        position: 2
      },
      {
        name: 'In Progress',
        description: 'Epics currently being worked on',
        color: '#3B82F6',
        category: 'IN_PROGRESS',
        isInitial: false,
        isFinal: false,
        position: 3
      },
      {
        name: 'Review',
        description: 'Epics under review',
        color: '#8B5CF6',
        category: 'IN_PROGRESS',
        isInitial: false,
        isFinal: false,
        position: 4
      },
      {
        name: 'Done',
        description: 'Completed epics',
        color: '#10B981',
        category: 'DONE',
        isInitial: false,
        isFinal: true,
        position: 5
      }
    ],
    transitions: [
      {
        name: 'Start Planning',
        description: 'Begin planning the epic',
        fromStateId: 'idea-state',
        toStateId: 'planning-state',
        type: 'MANUAL',
        position: 1,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Start Work',
        description: 'Begin working on the epic',
        fromStateId: 'planning-state',
        toStateId: 'inprogress-state',
        type: 'MANUAL',
        position: 2,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Submit for Review',
        description: 'Submit epic for review',
        fromStateId: 'inprogress-state',
        toStateId: 'review-state',
        type: 'MANUAL',
        position: 3,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Complete',
        description: 'Mark epic as completed',
        fromStateId: 'review-state',
        toStateId: 'done-state',
        type: 'MANUAL',
        position: 4,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN']
      },
      {
        name: 'Return to Planning',
        description: 'Return epic to planning phase',
        fromStateId: 'review-state',
        toStateId: 'planning-state',
        type: 'MANUAL',
        position: 5,
        allowedRoles: ['PROJECT_MANAGER', 'ADMIN']
      }
    ]
  }
];

export const defaultProjectTemplates = [
  {
    name: 'Agile Software Development',
    description: 'Complete template for agile software development projects',
    category: 'Software Development',
    methodology: 'AGILE',
    isPublic: true,
    configuration: {
      general: {
        allowPublicAccess: false,
        requireApprovalForTasks: false,
        enableTimeTracking: true,
        enableComments: true,
        enableAttachments: true,
        maxAttachmentSize: 25,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'txt']
      },
      notifications: {
        emailNotifications: true,
        inAppNotifications: true,
        notificationRules: []
      },
      workflow: {
        defaultWorkflowId: '',
        allowWorkflowOverride: true,
        requireStateTransitionComments: false,
        autoAssignTasks: false
      },
      security: {
        requireMfaForSensitiveActions: false,
        allowGuestAccess: false,
        sessionTimeout: 480
      }
    },
    workflows: [], // Will be populated with default workflow IDs
    customFields: [], // Will be populated with default custom field IDs
    defaultRoles: [
      {
        role: 'PROJECT_MANAGER',
        permissions: ['ALL'],
        isRequired: true
      },
      {
        role: 'DEVELOPER',
        permissions: ['READ_TASKS', 'UPDATE_TASKS', 'CREATE_TASKS'],
        isRequired: true
      },
      {
        role: 'TESTER',
        permissions: ['READ_TASKS', 'UPDATE_TASKS', 'CREATE_ISSUES'],
        isRequired: false
      }
    ],
    sampleTasks: [
      {
        name: 'Project Setup',
        description: 'Initialize project structure and development environment',
        type: 'EPIC',
        priority: 'HIGH',
        estimatedHours: 16
      },
      {
        name: 'User Authentication',
        description: 'Implement user login and registration functionality',
        type: 'STORY',
        priority: 'HIGH',
        estimatedHours: 24
      },
      {
        name: 'Setup CI/CD Pipeline',
        description: 'Configure continuous integration and deployment',
        type: 'TASK',
        priority: 'MEDIUM',
        estimatedHours: 8
      }
    ],
    tags: ['agile', 'software', 'development', 'scrum']
  },
  {
    name: 'Waterfall Project Management',
    description: 'Traditional waterfall project management template',
    category: 'Project Management',
    methodology: 'WATERFALL',
    isPublic: true,
    configuration: {
      general: {
        allowPublicAccess: false,
        requireApprovalForTasks: true,
        enableTimeTracking: true,
        enableComments: true,
        enableAttachments: true,
        maxAttachmentSize: 50,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg']
      },
      workflow: {
        allowWorkflowOverride: false,
        requireStateTransitionComments: true,
        autoAssignTasks: false
      }
    },
    workflows: [],
    customFields: [],
    defaultRoles: [
      {
        role: 'PROJECT_MANAGER',
        permissions: ['ALL'],
        isRequired: true
      },
      {
        role: 'TEAM_LEAD',
        permissions: ['READ_TASKS', 'UPDATE_TASKS', 'APPROVE_TASKS'],
        isRequired: true
      },
      {
        role: 'DEVELOPER',
        permissions: ['READ_TASKS', 'UPDATE_TASKS'],
        isRequired: true
      }
    ],
    sampleTasks: [
      {
        name: 'Requirements Analysis',
        description: 'Gather and analyze project requirements',
        type: 'TASK',
        priority: 'HIGHEST',
        estimatedHours: 40
      },
      {
        name: 'System Design',
        description: 'Create detailed system design documentation',
        type: 'TASK',
        priority: 'HIGHEST',
        estimatedHours: 32
      },
      {
        name: 'Implementation',
        description: 'Develop the system according to specifications',
        type: 'TASK',
        priority: 'HIGH',
        estimatedHours: 120
      }
    ],
    tags: ['waterfall', 'traditional', 'project-management']
  }
];