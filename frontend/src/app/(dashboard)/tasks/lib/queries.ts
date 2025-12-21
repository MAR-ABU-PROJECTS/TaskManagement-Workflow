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
