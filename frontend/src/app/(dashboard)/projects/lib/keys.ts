export const projectKeys = {
	all: ["projects"] as const,

	lists: () => [...projectKeys.all, "list"] as const,
	list: (filters?: unknown) => [...projectKeys.lists(), { filters }] as const,

	detail: (id: string | number) => [...projectKeys.all, id] as const,
};
