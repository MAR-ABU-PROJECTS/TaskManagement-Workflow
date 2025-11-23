import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const projects = [
	{
		id: 1,
		name: "Website Redesign",
		description: "Complete overhaul of company website",
		team: "Design Team",
		status: "In Progress",
		progress: 75,
		tasks: { total: 24, completed: 18 },
		members: 5,
		dueDate: "2025-02-15",
	},
	{
		id: 2,
		name: "Mobile App Development",
		description: "iOS and Android native applications",
		team: "Engineering",
		status: "In Progress",
		progress: 45,
		tasks: { total: 48, completed: 22 },
		members: 8,
		dueDate: "2025-03-30",
	},
	{
		id: 3,
		name: "Marketing Campaign Q1",
		description: "Q1 2025 marketing initiatives",
		team: "Marketing",
		status: "Planning",
		progress: 20,
		tasks: { total: 16, completed: 3 },
		members: 4,
		dueDate: "2025-03-31",
	},
	{
		id: 4,
		name: "Brand Guidelines",
		description: "Updated brand identity guidelines",
		team: "Design Team",
		status: "Completed",
		progress: 100,
		tasks: { total: 8, completed: 8 },
		members: 3,
		dueDate: "2025-01-10",
	},
];

export default function ProjectsPage() {
	return (
		<div className="flex flex-1 flex-col">
			{/* Main Content */}
			<main className="flex-1 overflow-auto p-6 px-4">
				<div className="mx-auto space-y-6">
					{/* Header */}
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-2">
							<Button size="lg" asChild>
								<Link href={"/projects/new"}>
									<Plus className="mr-2 h-4 w-4" />
									New Project
								</Link>
							</Button>
						</div>
					</div>

					{/* Projects Grid */}
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{projects.map((project) => (
							<Card
								key={project.id}
								className="hover:border-primary/50 transition-colors"
							>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<CardTitle className="text-base">
												<Link
													href={`/projects/${project.id}`}
													className="hover:text-primary"
												>
													{project.name}
												</Link>
											</CardTitle>
											<CardDescription className="mt-1 text-sm">
												{project.description}
											</CardDescription>
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
												>
													<MoreVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem>
													<Link
														href={`/projects/${project.id}/edit`}
													>
														Edit Project
													</Link>
												</DropdownMenuItem>
												{/* <DropdownMenuItem>
													Duplicate
												</DropdownMenuItem>
												<DropdownMenuItem>
													Archive
												</DropdownMenuItem> */}
												<DropdownMenuItem className="text-destructive">
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">
												Progress
											</span>
											<span className="font-medium">
												{project.progress}%
											</span>
										</div>
										<div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
											<div
												className="h-full bg-primary transition-all"
												style={{
													width: `${project.progress}%`,
												}}
											/>
										</div>
									</div>

									<div className="flex items-center justify-between text-sm">
										<div className="flex items-center gap-2">
											<Badge
												variant={
													project.status ===
													"Completed"
														? "default"
														: project.status ===
														  "In Progress"
														? "secondary"
														: "outline"
												}
											>
												{project.status}
											</Badge>
										</div>
										<span className="text-muted-foreground">
											{project.tasks.completed}/
											{project.tasks.total} tasks
										</span>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex -space-x-2">
											{Array.from({
												length: Math.min(
													project.members,
													3
												),
											}).map((_, i) => (
												<Avatar
													key={i}
													className="h-6 w-6 border-2 border-card"
												>
													<AvatarFallback className="text-xs">
														U{i + 1}
													</AvatarFallback>
												</Avatar>
											))}
											{project.members > 3 && (
												<div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium">
													+{project.members - 3}
												</div>
											)}
										</div>
										<span className="text-xs text-muted-foreground">
											Due {project.dueDate}
										</span>
									</div>

									<Button
										variant="outline"
										size="lg"
										className="w-full bg-transparent"
										asChild
									>
										<Link href={`/projects/${project.id}`}>
											View Project
										</Link>
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
