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
 * Standard board flow: To Do -> In Progress -> Review -> Done
 * Includes back transitions for quick corrections.
 */
const STANDARD_WORKFLOW: WorkflowTransitionRule[] = [
  // From DRAFT / ASSIGNED (To Do)
  { name: "Assign Task", from: TaskStatus.DRAFT, to: TaskStatus.ASSIGNED },
  { name: "Start Work", from: TaskStatus.DRAFT, to: TaskStatus.IN_PROGRESS },
  { name: "Start Work", from: TaskStatus.ASSIGNED, to: TaskStatus.IN_PROGRESS },
  { name: "Back to Backlog", from: TaskStatus.ASSIGNED, to: TaskStatus.DRAFT },

  // From IN_PROGRESS
  {
    name: "Ready for Review",
    from: TaskStatus.IN_PROGRESS,
    to: TaskStatus.REVIEW,
  },
  { name: "Back to To Do", from: TaskStatus.IN_PROGRESS, to: TaskStatus.ASSIGNED },
  { name: "Back to Backlog", from: TaskStatus.IN_PROGRESS, to: TaskStatus.DRAFT },

  // From REVIEW
  { name: "Mark Done", from: TaskStatus.REVIEW, to: TaskStatus.COMPLETED },
  { name: "Request Changes", from: TaskStatus.REVIEW, to: TaskStatus.IN_PROGRESS },
  { name: "Back to To Do", from: TaskStatus.REVIEW, to: TaskStatus.ASSIGNED },
  { name: "Back to Backlog", from: TaskStatus.REVIEW, to: TaskStatus.DRAFT },

  // From COMPLETED (Done)
  { name: "Back to Review", from: TaskStatus.COMPLETED, to: TaskStatus.REVIEW },
  { name: "Reopen Work", from: TaskStatus.COMPLETED, to: TaskStatus.IN_PROGRESS },
  { name: "Back to To Do", from: TaskStatus.COMPLETED, to: TaskStatus.ASSIGNED },
  { name: "Back to Backlog", from: TaskStatus.COMPLETED, to: TaskStatus.DRAFT },

  // Allow recovery for paused/rejected tasks
  { name: "Resume Work", from: TaskStatus.PAUSED, to: TaskStatus.IN_PROGRESS },
  { name: "Back to To Do", from: TaskStatus.PAUSED, to: TaskStatus.ASSIGNED },
  { name: "Reopen", from: TaskStatus.REJECTED, to: TaskStatus.ASSIGNED },
];

/**
 * BASIC Workflow: Uses the standard board flow
 */
const BASIC_WORKFLOW: WorkflowTransitionRule[] = STANDARD_WORKFLOW;

/**
 * AGILE Workflow: Uses the standard board flow
 */
const AGILE_WORKFLOW: WorkflowTransitionRule[] = STANDARD_WORKFLOW;

/**
 * BUG_TRACKING Workflow: Uses the standard board flow
 */
const BUG_TRACKING_WORKFLOW: WorkflowTransitionRule[] = STANDARD_WORKFLOW;

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
      "Board workflow: To Do -> In Progress -> Review -> Done (with back transitions)",
    [WorkflowType.AGILE]:
      "Board workflow: To Do -> In Progress -> Review -> Done (with back transitions)",
    [WorkflowType.BUG_TRACKING]:
      "Board workflow: To Do -> In Progress -> Review -> Done (with back transitions)",
    [WorkflowType.CUSTOM]: "Custom workflow defined in database",
  };

  return descriptions[workflowType];
}
