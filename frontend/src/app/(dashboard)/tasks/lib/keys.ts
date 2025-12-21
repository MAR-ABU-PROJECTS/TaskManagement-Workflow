export const taskKeys = {
	all: ["tasks"] as const,

	// list: (filters?: Record<string, any>) =>
	// 	[...projectKeys.lists(), { filters }] as const,

	detail: (id: string | number) => [...taskKeys.all, id] as const,

	board: () => [...taskKeys.all, "board"] as const,

	// Tasks for a specific project
	projectTasks: (projectId: string) =>
		[...taskKeys.board(), "project", projectId] as const,
};
