import { apiService } from "@/lib/apiService";
import { createTaskPSchemaType } from "../../projects/components/add-task-modal";

export const TaskService = {
	createProjectTask: (data: createTaskPSchemaType) =>
		apiService.post("/tasks", data),
	getProjectTasks: (projectId: string) =>
		apiService.get(`/tasks/board/${projectId}`),
	assignProjectTasks: ({
		taskId,
		assigneeId,
	}: {
		taskId: string;
		assigneeId: string;
	}) => apiService.post(`/tasks/${taskId}/assign`, { assigneeId }),
	editProjectTask: ({
		taskId,
		data,
	}: {
		data: createTaskPSchemaType;
		taskId: string;
	}) => apiService.patch(`/tasks/${taskId}`, data),

	transitionTask: ({ taskId, status }: { status: string; taskId: string }) =>
		apiService.post(`/tasks/${taskId}/transition`, { status }),
	uploadAttachment: ({
		formData,
		taskId,
	}: {
		formData: FormData;
		taskId: string;
	}) => apiService.post(`/tasks/${taskId}/attachments`, formData),
	getTaskAttachments: (taskId: string) =>
		apiService.get(`/tasks/${taskId}/attachments`),
	deleteAttachment: ({
		taskId,
		attachmentId,
	}: {
		taskId: string;
		attachmentId: string;
	}) => apiService.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
	deleteTaskProject: (taskId: string) => apiService.delete(`/tasks/${taskId}`),
	downloadAttachment: ({
		taskId,
		attachmentId,
	}: {
		taskId: string;
		attachmentId: string;
	}) =>
		apiService.get(`/tasks/${taskId}/attachments/${attachmentId}`, {
			responseType: "blob",
		}),
	getTaskComments: (taskId: string) =>
		apiService.get(`/tasks/${taskId}/comments`),

	addComment: ({ comment, taskId }: { comment: string; taskId: string }) =>
		apiService.post(`/tasks/${taskId}/comments`, { content: comment }),
	deleteComment: ({
		commentId,
		taskId,
	}: {
		commentId: string;
		taskId: string;
	}) => apiService.delete(`/tasks/${taskId}/comments/${commentId}`),
	getTaskActivities: (taskId: string) =>
		apiService.get(`/tasks/${taskId}/activity`),

	// getProjectById: (id: string) => apiService.get(`/projects/${id}`),
	// updateProject: (id: string, data: editProjectType) =>
	//   apiService.patch(`/projects/${id}`, data),
	// deleteProject: (id: string) => apiService.delete(`/projects/${id}`),
};
