export const userKeys = {
	all: ["users"] as const,

	// lists: () => [...projectKeys.all, "list"] as const,
	// list: (filters?: unknown) => [...projectKeys.lists(), { filters }] as const,

	details: (id:string) => [...userKeys.all, "detail", id] as const,
	// detail: (id: string | number) => [...projectKeys.details(), id] as const,
};
