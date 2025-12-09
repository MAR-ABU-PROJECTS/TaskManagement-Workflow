/**
 * Built-in Workflow Configurations
 * Defines allowed status transitions for each WorkflowType
 */

import { WorkflowType, TaskStatus, ProjectRole } from "@prisma/client";

export interface WorkflowTransitionRule {
  name: string;
  from: TaskStatus;
  to: TaskStatus;
  requiredRole?: ProjectRole;
  description?: string;
}

/**
 * BASIC Workflow: Simple linear progression
 * DRAFT → ASSIGNED → IN_PROGRESS → COMPLETED
 */
const BASIC_WORKFLOW: WorkflowTransitionRule[] = [
  // From DRAFT
  { name: "Assign Task", from: TaskStatus.DRAFT, to: TaskStatus.ASSIGNED },
  { name: "Reject Draft", from: TaskStatus.DRAFT, to: TaskStatus.REJECTED },

  // From ASSIGNED
  { name: "Start Work", from: TaskStatus.ASSIGNED, to: TaskStatus.IN_PROGRESS },
  {
    name: "Reject Assignment",
    from: TaskStatus.ASSIGNED,
    to: TaskStatus.REJECTED,
  },

  // From IN_PROGRESS
  {
    name: "Complete",
    from: TaskStatus.IN_PROGRESS,
    to: TaskStatus.COMPLETED,
    requiredRole: ProjectRole.PROJECT_LEAD,
  },
  { name: "Pause Work", from: TaskStatus.IN_PROGRESS, to: TaskStatus.PAUSED },
  {
    name: "Reject Work",
    from: TaskStatus.IN_PROGRESS,
    to: TaskStatus.REJECTED,
    requiredRole: ProjectRole.PROJECT_LEAD,
  },

  // From PAUSED
  { name: "Resume Work", from: TaskStatus.PAUSED, to: TaskStatus.IN_PROGRESS },
  { name: "Reject Paused", from: TaskStatus.PAUSED, to: TaskStatus.REJECTED },

  // From REVIEW
  {
    name: "Approve",
    from: TaskStatus.REVIEW,
    to: TaskStatus.COMPLETED,
    requiredRole: ProjectRole.PROJECT_LEAD,
  },
  {
    name: "Request Changes",
    from: TaskStatus.REVIEW,
    to: TaskStatus.IN_PROGRESS,
  },
  {
    name: "Reject Review",
    from: TaskStatus.REVIEW,
    to: TaskStatus.REJECTED,
    requiredRole: ProjectRole.PROJECT_LEAD,
  },

  // From REJECTED - Allow reopen
  { name: "Reopen", from: TaskStatus.REJECTED, to: TaskStatus.DRAFT },

  // From COMPLETED - Allow reopen if needed
  {
    name: "Reopen Completed",
    from: TaskStatus.COMPLETED,
    to: TaskStatus.IN_PROGRESS,
    requiredRole: ProjectRole.PROJECT_ADMIN,
  },
];

/**
 * AGILE Workflow: Scrum/Kanban style
 * Includes backlog management and review process
 */
const AGILE_WORKFLOW: WorkflowTransitionRule[] = [
  // From DRAFT (Backlog)
  {
    name: "Move to Draft",
    from: TaskStatus.DRAFT,
    to: TaskStatus.ASSIGNED,
    description: "Ready for assignment",
  },
  { name: "Reject Idea", from: TaskStatus.DRAFT, to: TaskStatus.REJECTED },

  // From ASSIGNED (To Do)
  {
    name: "Start Sprint",
    from: TaskStatus.ASSIGNED,
    to: TaskStatus.IN_PROGRESS,
  },
  { name: "Back to Backlog", from: TaskStatus.ASSIGNED, to: TaskStatus.DRAFT },

  // From IN_PROGRESS (In Progress)
  {
    name: "Ready for Review",
    from: TaskStatus.IN_PROGRESS,
    to: TaskStatus.REVIEW,
  },
  { name: "Pause Sprint", from: TaskStatus.IN_PROGRESS, to: TaskStatus.PAUSED },
  {
    name: "Block",
    from: TaskStatus.IN_PROGRESS,
    to: TaskStatus.PAUSED,
    description: "Blocked by dependency",
  },

  // From PAUSED (Blocked/On Hold)
  { name: "Unblock", from: TaskStatus.PAUSED, to: TaskStatus.IN_PROGRESS },
  { name: "Back to To Do", from: TaskStatus.PAUSED, to: TaskStatus.ASSIGNED },

  // From REVIEW (Code Review / QA)
  {
    name: "Approve & Done",
    from: TaskStatus.REVIEW,
    to: TaskStatus.COMPLETED,
    requiredRole: ProjectRole.PROJECT_LEAD,
  },
  {
    name: "Request Changes",
    from: TaskStatus.REVIEW,
    to: TaskStatus.IN_PROGRESS,
  },
  {
    name: "Reject & Close",
    from: TaskStatus.REVIEW,
    to: TaskStatus.REJECTED,
    requiredRole: ProjectRole.PROJECT_LEAD,
  },

  // From REJECTED
  {
    name: "Reopen to Backlog",
    from: TaskStatus.REJECTED,
    to: TaskStatus.DRAFT,
  },

  // From COMPLETED
  {
    name: "Reopen",
    from: TaskStatus.COMPLETED,
    to: TaskStatus.IN_PROGRESS,
    requiredRole: ProjectRole.PROJECT_ADMIN,
  },
];

/**
 * BUG_TRACKING Workflow: Bug lifecycle management
 * NEW → CONFIRMED → IN_PROGRESS → TESTING → CLOSED
 */
const BUG_TRACKING_WORKFLOW: WorkflowTransitionRule[] = [
  // From DRAFT (New Bug)
  {
    name: "Confirm Bug",
    from: TaskStatus.DRAFT,
    to: TaskStatus.ASSIGNED,
    requiredRole: ProjectRole.PROJECT_LEAD,
  },
  { name: "Cannot Reproduce", from: TaskStatus.DRAFT, to: TaskStatus.REJECTED },
  { name: "Duplicate", from: TaskStatus.DRAFT, to: TaskStatus.REJECTED },

  // From ASSIGNED (Confirmed)
  { name: "Start Fix", from: TaskStatus.ASSIGNED, to: TaskStatus.IN_PROGRESS },
  { name: "Not a Bug", from: TaskStatus.ASSIGNED, to: TaskStatus.REJECTED },

  // From IN_PROGRESS (Fixing)
  {
    name: "Ready for Testing",
    from: TaskStatus.IN_PROGRESS,
    to: TaskStatus.REVIEW,
    description: "Fix ready for QA",
  },
  { name: "Pause Fix", from: TaskStatus.IN_PROGRESS, to: TaskStatus.PAUSED },
  { name: "Cannot Fix", from: TaskStatus.IN_PROGRESS, to: TaskStatus.REJECTED },

  // From PAUSED
  { name: "Resume Fix", from: TaskStatus.PAUSED, to: TaskStatus.IN_PROGRESS },

  // From REVIEW (Testing/QA)
  {
    name: "Test Passed - Close",
    from: TaskStatus.REVIEW,
    to: TaskStatus.COMPLETED,
    requiredRole: ProjectRole.PROJECT_LEAD,
  },
  {
    name: "Test Failed - Reopen",
    from: TaskStatus.REVIEW,
    to: TaskStatus.IN_PROGRESS,
  },
  {
    name: "Won't Fix",
    from: TaskStatus.REVIEW,
    to: TaskStatus.REJECTED,
    requiredRole: ProjectRole.PROJECT_ADMIN,
  },

  // From REJECTED
  { name: "Reopen Bug", from: TaskStatus.REJECTED, to: TaskStatus.DRAFT },

  // From COMPLETED
  {
    name: "Regression Found",
    from: TaskStatus.COMPLETED,
    to: TaskStatus.ASSIGNED,
    requiredRole: ProjectRole.PROJECT_LEAD,
  },
];

/**
 * Workflow configurations mapped by type
 */
export const WORKFLOWS: Record<WorkflowType, WorkflowTransitionRule[]> = {
  [WorkflowType.BASIC]: BASIC_WORKFLOW,
  [WorkflowType.AGILE]: AGILE_WORKFLOW,
  [WorkflowType.BUG_TRACKING]: BUG_TRACKING_WORKFLOW,
  [WorkflowType.CUSTOM]: [], // Custom workflows use database
};

/**
 * Check if a status transition is allowed
 */
export function isTransitionAllowed(
  workflowType: WorkflowType,
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
  userRole?: ProjectRole
): boolean {
  const workflow = WORKFLOWS[workflowType];

  if (!workflow || workflow.length === 0) {
    return true; // Custom workflow - check database
  }

  const transition = workflow.find(
    (t) => t.from === fromStatus && t.to === toStatus
  );

  if (!transition) {
    return false; // Transition not defined
  }

  // Check role requirement
  if (transition.requiredRole && transition.requiredRole !== userRole) {
    return false; // User doesn't have required role
  }

  return true;
}

/**
 * Get available transitions from current status
 */
export function getAvailableTransitions(
  workflowType: WorkflowType,
  currentStatus: TaskStatus,
  userRole?: ProjectRole
): WorkflowTransitionRule[] {
  const workflow = WORKFLOWS[workflowType];

  if (!workflow || workflow.length === 0) {
    return []; // Custom workflow - query database
  }

  return workflow.filter((t) => {
    if (t.from !== currentStatus) return false;
    if (t.requiredRole && t.requiredRole !== userRole) return false;
    return true;
  });
}

/**
 * Get workflow description
 */
export function getWorkflowDescription(workflowType: WorkflowType): string {
  const descriptions: Record<WorkflowType, string> = {
    [WorkflowType.BASIC]:
      "Simple linear workflow: Draft → Assigned → In Progress → Completed",
    [WorkflowType.AGILE]: "Agile/Scrum workflow with backlog and review stages",
    [WorkflowType.BUG_TRACKING]:
      "Bug tracking workflow with confirmation and testing stages",
    [WorkflowType.CUSTOM]: "Custom workflow defined in database",
  };

  return descriptions[workflowType];
}
