import { useQuery } from "@tanstack/react-query";
import { taskKeys } from "./keys";
import { TaskService } from "./service";

export const useGetProjectTasks = (
	id: string,
	options?: { disableGlobalSuccess?: boolean }
) => {
	return useQuery({
		queryKey: taskKeys.projectTasks(id),
		queryFn: () => TaskService.getProjectTasks(id),
		meta: {
			disableGlobalSuccess: options?.disableGlobalSuccess,
		},
	});
};
export type User = {
	id: string;
	name: string;
	email: string;
	role: string;
};

export type Project = {
	id: string;
	name: string;
	key: string;
	description: string;
	creatorId: string;
};

export type Assignee = {
	// adjust based on what `{…}` actually contains
	id: string;
	name: string;
	email?: string;
	role?: string;
};

export type Task = {
	id: string;
	title: string;
	description: string;

	issueType: "TASK" | "BUG" | "STORY" | string;
	priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
	status: "ASSIGNED" | "OPEN" | "IN_PROGRESS" | "DONE" | string;

	position: number;
	loggedHours: number;
	requiresApproval: boolean;

	createdAt: string;
	updatedAt: string;
	dueDate: string | null;

	estimatedHours: number | null;
	storyPoints: number | null;

	approvedBy: User | null;
	approvedById: string | null;

	creator: User;
	creatorId: string;

	reporterId: string | null;

	project: Project;
	projectId: string;

	boardColumnId: string | null;
	componentId: string | null;
	epicId: string | null;
	sprintId: string | null;
	versionId: string | null;

	parentTask: Task | null;
	parentTaskId: string | null;

	rejectionReason: string | null;

	assignees: Assignee[];
	subTasks: Task[];

	labels: string[];
};

export const useGetTaskDetails = (taskId: string) => {
	return useQuery<{data: Task}>({
		queryKey: taskKeys.detail(taskId),
		queryFn: () => TaskService.getTaskDetail(taskId),
		enabled: !!taskId,
		meta: {
			disableGlobalSuccess: false,
		},
	});
};

export type TaskAttachment = {
	id: string;
	taskId: string;

	fileName: string;
	originalName: string;
	filePath: string;
	fileSize: number;
	mimeType: string;

	createdAt: string; // ISO date string

	uploadedById: string;
	uploadedBy: {
		id: string;
		name: string;
		email: string;
	};
};
export const useGetAttachment = (
	taskId: string,
	options?: { disableGlobalSuccess?: boolean }
) => {
	return useQuery<{ data: TaskAttachment[] }>({
		queryKey: taskKeys.attachments(taskId),
		queryFn: () => TaskService.getTaskAttachments(taskId),
		enabled: !!taskId,
		meta: {
			disableGlobalSuccess: options?.disableGlobalSuccess,
		},
	});
};

export const useDownloadAttachment = (
	taskId: string,
	options?: { disableGlobalSuccess?: boolean }
) => {
	return useQuery<{ data: TaskAttachment[] }>({
		queryKey: taskKeys.attachments(taskId),
		queryFn: () => TaskService.getTaskAttachments(taskId),
		enabled: !!taskId,
		meta: {
			disableGlobalSuccess: options?.disableGlobalSuccess,
		},
	});
};

export const useGetComments = (
	taskId: string,
	options?: { disableGlobalSuccess?: boolean }
) => {
	return useQuery({
		queryKey: taskKeys.comments(taskId),
		queryFn: () => TaskService.getTaskComments(taskId),
		enabled: !!taskId,
		meta: {
			disableGlobalSuccess: options?.disableGlobalSuccess,
		},
		staleTime: 0,
	});
};

export const useGetActivities = (taskId: string) => {
	return useQuery({
		queryKey: taskKeys.activities(taskId),
		queryFn: () => TaskService.getTaskActivities(taskId),
		enabled: !!taskId,
		meta: {
			disableGlobalSuccess: false,
		},
	});
};
