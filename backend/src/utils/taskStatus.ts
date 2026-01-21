import { TaskStatus } from "../types/enums";

const STATUS_ALIASES: Record<string, TaskStatus> = {
  TODO: TaskStatus.DRAFT,
  TO_DO: TaskStatus.DRAFT,
  BACKLOG: TaskStatus.DRAFT,
  DRAFT: TaskStatus.DRAFT,
  ASSIGNED: TaskStatus.ASSIGNED,
  IN_PROGRESS: TaskStatus.IN_PROGRESS,
  PAUSED: TaskStatus.PAUSED,
  IN_REVIEW: TaskStatus.REVIEW,
  REVIEW: TaskStatus.REVIEW,
  TESTING: TaskStatus.REVIEW,
  QA: TaskStatus.REVIEW,
  DONE: TaskStatus.COMPLETED,
  COMPLETED: TaskStatus.COMPLETED,
  CLOSED: TaskStatus.COMPLETED,
  REJECTED: TaskStatus.REJECTED,
};

export const normalizeTaskStatus = (
  value: unknown,
): TaskStatus | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const key = value.trim().toUpperCase();
  if (!key) {
    return undefined;
  }

  return STATUS_ALIASES[key];
};
