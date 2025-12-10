import { useMutation } from "@tanstack/react-query";
import { projectService } from "../service";
import { createProjectType } from "@/components/new-project";

export const useUpdateProject = () => {
	return useMutation({
		mutationFn: (project: createProjectType) =>
			projectService.createProject(project),
	});
};
