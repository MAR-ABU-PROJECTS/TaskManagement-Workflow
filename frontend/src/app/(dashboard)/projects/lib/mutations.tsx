import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../lib/service";
import { createProjectType } from "@/components/new-project";
import { projectKeys } from "./keys";
import { editProjectType } from "@/components/EditProjects";

export const useCreateProject = () => {
	return useMutation({
		mutationFn: (project: createProjectType) =>
			projectService.createProject(project),
	});
};

export const useDeleteProject = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (projectId: string) =>
			projectService.deleteProject(projectId),

		onSuccess: () => {
			qc.invalidateQueries({ queryKey: projectKeys.all });
		},
	});
};

export const useUpdateProject = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			project,
			id,
		}: {
			project: editProjectType;
			id: string;
		}) => projectService.updateProject(id, project),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: projectKeys.all });
		},
	});
};


export const useRemoveProjectMembers = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: projectService.removeMembers,
		onSuccess: (_data, variables) => {
			qc.invalidateQueries({
				queryKey: projectKeys.projectMembers({
					projectId: variables.projectId,
				}),
			});
		},
	});
};

export const useAddProjectMembers = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			projectId,
			members,
		}: {
			projectId: string;
			members: string[];
		}) => projectService.addProjectMembers(projectId, members),
		onSuccess: (_data, variables) => {
			qc.invalidateQueries({
				queryKey: projectKeys.projectMembers({
					projectId: variables.projectId,
				}),
			});
		},
	});
};
