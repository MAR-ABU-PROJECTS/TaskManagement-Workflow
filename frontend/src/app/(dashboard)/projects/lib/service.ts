import { editProjectType } from "@/components/EditProjects";
import { createProjectType } from "@/components/new-project";
import { apiService } from "@/lib/apiService";

type RemoveMembersPayload =
	| { projectId: string; userId: string }
	| { projectId: string; userIds: string[] };
export const projectService = {
	createProject: (data: createProjectType) => {
		const members = data.members.map((m) => ({ userId: m }));
		return apiService.post("/projects", { ...data, members });
	},
	getProjects: () => apiService.get("/projects"),
	getProjectById: (id: string) => apiService.get(`/projects/${id}`),

	updateProject: (id: string, data: editProjectType) =>
		apiService.patch(`/projects/${id}`, data),
	deleteProject: (id: string) => apiService.delete(`/projects/${id}`),

	getProjectMembers: (id: string) =>
		apiService.get(`/projects/${id}/members`),

	addProjectMembers: (projectId: string, members: string[]) =>
		apiService.post(`/projects/${projectId}/members`, { ...members }),

	removeProjectMember: ({
		projectId,
		userId,
	}: {
		projectId: string;
		userId: string;
	}) => apiService.delete(`/projects/${projectId}/members/${userId}`),

	removeProjectMembers({
		projectId,
		userIds,
	}: {
		projectId: string;
		userIds: string[];
	}) {
		return apiService.delete(`/projects/${projectId}/members/_`, {
			data: { userIds },
		});
	},

	removeMembers(payload: RemoveMembersPayload) {
		const { projectId } = payload;

		if ("userId" in payload) {
			return apiService.delete(
				`/projects/${projectId}/members/${payload.userId}`
			);
		}

		return apiService.delete(`/projects/${projectId}/members/_`, {
			data: { userIds: payload.userIds },
		});
	},
};
