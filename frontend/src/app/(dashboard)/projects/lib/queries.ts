import { useQuery, useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "./keys";
import { projectService } from "./service";
import { ProjectType } from "./type";

export const useGetProjects = () => {
	return useQuery<{ data: ProjectType[] }>({
		queryKey: projectKeys.all,
		queryFn: () => projectService.getProjects(),
	});
};

export const useGetProjectsById = (id: string) => {
	const qc = useQueryClient();
	return useQuery<{ data: ProjectType }>({
		queryKey: projectKeys.detail(id),
		queryFn: () => projectService.getProjectById(id),
		initialData: () => {
			const listData = qc.getQueryData<{
				data: ProjectType[];
			}>(projectKeys.all);

			const project = listData?.data?.find((item) => item.id === id);

			if (!project) return undefined;

			return {
				data: project,
			};
		},
	});
};

export const useGetProjectsMembers = (id: string) => {
	return useQuery({
		queryKey: projectKeys.projectMembers({ projectId: id }),
		queryFn: () => projectService.getProjectMembers(id),
	});
};
