import { apiService } from "@/lib/apiService";
import { Role } from "@/lib/rolespermissions";

export const userService = {
	getUsers: () => apiService.get("/users"),
	getUserById: (id: string) => apiService.get(`/users/${id}`),
	// updateProject: (id: string, data: createProjectType) =>
	// 	apiService.patch(`/projects/${id}`, data),
	deleteUser: (id: string) => apiService.delete(`/users/${id}`),
	promoteUser: (id: string, role: Role) =>
		apiService.post(`/users/${id}/promote`, { newRole: role }),
	demoteUser: (id: string, role: Role) =>
		apiService.post(`/users/${id}/demote`, { newRole: role }),
	deactivateUser: (id: string) =>
		apiService.post(`/users/${id}/deactivate`, {}),
	activateUser: (id: string) => apiService.post(`/users/${id}/activate`, {}),
	bulkDeactivateUser: (ids: string[]) =>
		apiService.post(`/users/bulk/deactivate`, {
			userIds: ids,
		}),
};
