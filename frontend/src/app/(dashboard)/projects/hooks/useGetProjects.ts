import { useQuery } from "@tanstack/react-query";
import { projectService } from "../service";
import { projectKeys } from "../keys";

export const useGetProject = () => {
	return useQuery({
		queryKey: projectKeys.all,
		queryFn: () => projectService.getProjects(),
	});
};
