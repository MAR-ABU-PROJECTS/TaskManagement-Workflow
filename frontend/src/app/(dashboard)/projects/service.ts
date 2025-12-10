import { createProjectType } from "@/components/new-project";
import { apiService } from "@/lib/apiService";

export const projectService = {
	createProject: (data: createProjectType) =>
		apiService.post("/projects", data),
	getProjects: () => apiService.get("/projects"),
	getProjectById: (id: string) => apiService.get(`/projects/${id}`),
	updateProject: (id: string, data: createProjectType) =>
		apiService.patch(`/projects/${id}`, data),
	deleteProject: (id: string) => apiService.delete(`/projects/${id}`),
};
