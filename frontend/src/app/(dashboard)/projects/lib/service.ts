import { editProjectType } from "@/components/EditProjects";
import { createProjectType } from "@/components/new-project";
import { apiService } from "@/lib/apiService";

export const projectService = {
	createProject: (data: createProjectType) =>
		apiService.post("/projects", data),
	getProjects: () => apiService.get("/projects"),
	getProjectById: (id: string) => apiService.get(`/projects/${id}`),

	updateProject: (id: string, data: editProjectType) =>
		apiService.patch(`/projects/${id}`, data),
	deleteProject: (id: string) => apiService.delete(`/projects/${id}`),

	getProjectMembers: (id: string) =>
		apiService.get(`/projects/${id}/members`),
	deleteProjectMember: ({
		projectId,
		userId,
	}: {
		projectId: string;
		userId: string;
	}) => apiService.delete(`/projects/${projectId}/members/${userId}`),

	addProjectMembers: (projectId: string, members: string[]) =>
		apiService.post(`/projects/${projectId}/members`, { ...members }),
};
