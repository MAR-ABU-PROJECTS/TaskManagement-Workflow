export const taskKeys = {
	all: ["tasks"] as const,

	detail: (id: string) => [...taskKeys.all, id] as const,

	board: () => [...taskKeys.all, "board"] as const,

	projectTasks: (projectId: string) =>
		[...taskKeys.board(), "project", projectId] as const,

	attachments: (taskId: string) =>
		[...taskKeys.all, "attachments", { taskId }] as const,

	downloadattachment: ({
		taskId,
		attachmentId,
	}: {
		taskId: string;
		attachmentId: string;
	}) => [...taskKeys.all, "attachments", { taskId, attachmentId }] as const,

	comments: (taskId: string) =>
		[...taskKeys.all, "comments", { taskId }] as const,
};
