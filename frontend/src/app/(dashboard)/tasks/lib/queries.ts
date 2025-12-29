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
