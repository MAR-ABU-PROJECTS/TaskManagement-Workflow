import { useMutation } from "@tanstack/react-query";
import { projectService } from "../service";
import { createProjectType } from "@/components/new-project";

export const useCreateProject = () => {
	return useMutation({
		mutationFn: (project: createProjectType) =>
			projectService.createProject(project),
	});
};


