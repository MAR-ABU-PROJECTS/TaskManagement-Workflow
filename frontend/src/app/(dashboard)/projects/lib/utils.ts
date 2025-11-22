export const columns = [
	{ id: "backlog", title: "Backlog", color: "bg-gray-500" },
	{ id: "todo", title: "To Do", color: "bg-blue-500" },
	{ id: "in-progress", title: "In Progress", color: "bg-yellow-500" },
	{ id: "review", title: "Review", color: "bg-purple-500" },
	{ id: "done", title: "Done", color: "bg-green-500" },
];

export const initialTasks = [
	{
		id: 1,
		title: "Design homepage mockup",
		description: "Create high-fidelity mockup for new homepage",
		status: "in-progress",
		priority: "High",
		assignee: "JD",
		comments: 3,
		attachments: 2,
	},
	{
		id: 2,
		title: "Update navigation menu",
		description: "Implement new navigation structure",
		status: "todo",
		priority: "Medium",
		assignee: "JS",
		comments: 1,
		attachments: 0,
	},
	{
		id: 3,
		title: "Review color palette",
		description: "Finalize brand colors for redesign",
		status: "review",
		priority: "High",
		assignee: "MJ",
		comments: 5,
		attachments: 1,
	},
	{
		id: 4,
		title: "Create component library",
		description: "Build reusable UI components",
		status: "in-progress",
		priority: "Critical",
		assignee: "SW",
		comments: 2,
		attachments: 3,
	},
	{
		id: 5,
		title: "Setup project structure",
		description: "Initialize Next.js project",
		status: "done",
		priority: "High",
		assignee: "TB",
		comments: 0,
		attachments: 0,
	},
	{
		id: 6,
		title: "Research competitors",
		description: "Analyze competitor websites",
		status: "backlog",
		priority: "Low",
		assignee: "JD",
		comments: 1,
		attachments: 4,
	},

	{
		id: 6,
		title: "Research competitors",
		description: "Analyze competitor websites",
		status: "backlog",
		priority: "Low",
		assignee: "JD",
		comments: 1,
		attachments: 4,
	},

	



];

export function getPriorityColor(priority: string) {
	switch (priority) {
		case "Critical":
			return "bg-red-500/10 text-red-500 border-red-500/20";
		case "High":
			return "bg-orange-500/10 text-orange-500 border-orange-500/20";
		case "Medium":
			return "bg-blue-500/10 text-blue-500 border-blue-500/20";
		default:
			return "bg-gray-500/10 text-gray-500 border-gray-500/20";
	}
}
