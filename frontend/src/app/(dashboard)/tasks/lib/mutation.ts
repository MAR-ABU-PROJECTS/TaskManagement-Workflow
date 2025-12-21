import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskService } from "./service";
import { createTaskPSchemaType } from "../../projects/components/add-task-modal";
import { taskKeys } from "./keys";

export const useCreateTaskProject = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (task: createTaskPSchemaType) =>
			TaskService.createProjectTask(task),

		onSuccess: (_data, variables) => {
			qc.invalidateQueries({
				queryKey: taskKeys.projectTasks(variables.projectId),
			});
		},
	});
};

export const useAssignTaskProject = (projectId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			taskId,
			assigneeId,
		}: {
			taskId: string;
			assigneeId: string;
		}) => TaskService.assignProjectTasks({ taskId, assigneeId }),

		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: taskKeys.projectTasks(projectId),
			});
		},
	});
};

export const useEditTaskProject = (projectId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			taskId,
			task,
		}: {
			taskId: string;
			task: createTaskPSchemaType;
		}) => TaskService.editProjectTask({ taskId, data: task }),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: taskKeys.projectTasks(projectId),
			});
		},
	});
};

export const useTransitionTask = (projectId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
			TaskService.transitionTask({ taskId, status }),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: taskKeys.projectTasks(projectId),
			});
		},
	});
};
