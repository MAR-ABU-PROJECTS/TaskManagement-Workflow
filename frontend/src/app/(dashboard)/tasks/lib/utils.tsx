import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export function getStatusIcon(status: string) {
	switch (status) {
		case "Done":
			return <CheckCircle2 className="h-4 w-4 text-green-500" />;
		case "In Progress":
			return <Clock className="h-4 w-4 text-yellow-500" />;
		default:
			return <AlertCircle className="h-4 w-4 text-blue-500" />;
	}
}

export function getPriorityColor(priority: string) {
	switch (priority.toLowerCase()) {
		case "critical":
			return "bg-red-500/10 text-red-500 border-red-500/20";
		case "high":
			return "bg-orange-500/10 text-orange-500 border-orange-500/20";
		case "medium":
			return "bg-blue-500/10 text-blue-500 border-blue-500/20";
		default:
			return "bg-gray-500/10 text-gray-500 border-gray-500/20";
	}
}

export const tasks = [
	{
		id: 1,
		title: "Design homepage mockup",
		project: "Website Redesign",
		status: "In Progress",
		priority: "High",
		assignee: { name: "John Doe", avatar: "JD" },
		dueDate: "2025-01-20",
		progress: 60,
	},
	{
		id: 2,
		title: "Update navigation menu",
		project: "Website Redesign",
		status: "To Do",
		priority: "Medium",
		assignee: { name: "Jane Smith", avatar: "JS" },
		dueDate: "2025-01-22",
		progress: 0,
	},
	{
		id: 3,
		title: "Review color palette",
		project: "Website Redesign",
		status: "Review",
		priority: "High",
		assignee: { name: "Mike Johnson", avatar: "MJ" },
		dueDate: "2025-01-18",
		progress: 90,
	},
	{
		id: 4,
		title: "Implement authentication",
		project: "Mobile App",
		status: "In Progress",
		priority: "Critical",
		assignee: { name: "Sarah Williams", avatar: "SW" },
		dueDate: "2025-01-25",
		progress: 45,
	},
	{
		id: 5,
		title: "Write API documentation",
		project: "Mobile App",
		status: "To Do",
		priority: "Low",
		assignee: { name: "Tom Brown", avatar: "TB" },
		dueDate: "2025-01-30",
		progress: 0,
	},
];
