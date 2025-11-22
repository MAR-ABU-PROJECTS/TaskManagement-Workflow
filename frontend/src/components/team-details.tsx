import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Plus,
	Mail,
	MoreVertical,
	Crown,
	Shield,
	UserIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const teamMembers = [
	{
		id: 1,
		name: "John Doe",
		email: "john@marprojects.com",
		role: "Owner",
		avatar: "JD",
	},
	{
		id: 2,
		name: "Jane Smith",
		email: "jane@marprojects.com",
		role: "Admin",
		avatar: "JS",
	},
	{
		id: 3,
		name: "Mike Johnson",
		email: "mike@marprojects.com",
		role: "Member",
		avatar: "MJ",
	},
	{
		id: 4,
		name: "Sarah Williams",
		email: "sarah@marprojects.com",
		role: "Member",
		avatar: "SW",
	},
	{
		id: 5,
		name: "Tom Brown",
		email: "tom@marprojects.com",
		role: "Member",
		avatar: "TB",
	},
];

const teamProjects = [
	{
		id: 1,
		name: "Website Redesign",
		status: "In Progress",
		tasks: 24,
		completed: 18,
	},
	{ id: 2, name: "Mobile App", status: "Planning", tasks: 12, completed: 3 },
	{
		id: 3,
		name: "Brand Guidelines",
		status: "Completed",
		tasks: 8,
		completed: 8,
	},
];

function getRoleIcon(role: string) {
	switch (role) {
		case "Owner":
			return <Crown className="h-3 w-3" />;
		case "Admin":
			return <Shield className="h-3 w-3" />;
		default:
			return <UserIcon className="h-3 w-3" />;
	}
}

function getRoleBadgeVariant(role: string) {
	switch (role) {
		case "Owner":
			return "default";
		case "Admin":
			return "secondary";
		default:
			return "outline";
	}
}

export default function TeamDetailPage() {
	return (
		<div className="flex flex-1 flex-col">
			{/* Header */}

			{/* Main Content */}
			<main className="flex-1 overflow-auto px-4 p-6">
				<div className="mx-auto space-y-6">
					<div className="flex fex-wrap items-center gap-2">
						<div className="flex items-center gap-3">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
								<span className="text-sm font-bold text-white">
									D
								</span>
							</div>
							<h1 className="text-lg font-semibold">
								Design Team
							</h1>
						</div>
						<div className="ml-auto flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								className="bg-transparent"
							>
								<Mail className="mr-2 h-4 w-4" />
								Invite Members
							</Button>
							<Button size="sm" asChild>
								<Link href={'/projects/new'}>
									<Plus className="mr-2 h-4 w-4" />
									New Project
								</Link>
							</Button>
						</div>
					</div>
					{/* Team Info */}
					<Card>
						<CardHeader>
							<CardTitle>Team Information</CardTitle>
							<CardDescription>
								UI/UX and visual design team
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-3">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Members
									</p>
									<p className="text-2xl font-bold">
										{teamMembers.length}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Active Projects
									</p>
									<p className="text-2xl font-bold">
										{
											teamProjects.filter(
												(p) => p.status !== "Completed"
											).length
										}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Total Tasks
									</p>
									<p className="text-2xl font-bold">
										{teamProjects.reduce(
											(acc, p) => acc + p.tasks,
											0
										)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Tabs */}
					<Tabs defaultValue="members" className="space-y-4">
						<TabsList>
							<TabsTrigger value="members">Members</TabsTrigger>
							<TabsTrigger value="projects">Projects</TabsTrigger>
							<TabsTrigger value="settings">Settings</TabsTrigger>
						</TabsList>

						<TabsContent value="members" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Team Members</CardTitle>
									<CardDescription>
										Manage team members and their roles
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{teamMembers.map((member) => (
											<div
												key={member.id}
												className="flex items-center justify-between"
											>
												<div className="flex items-center gap-3">
													<Avatar>
														<AvatarFallback>
															{member.avatar}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="text-sm font-medium">
															{member.name}
														</p>
														<p className="text-sm text-muted-foreground">
															{member.email}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<Badge
														variant={getRoleBadgeVariant(
															member.role
														)}
													>
														<span className="mr-1">
															{getRoleIcon(
																member.role
															)}
														</span>
														{member.role}
													</Badge>
													<DropdownMenu>
														<DropdownMenuTrigger
															asChild
														>
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
																Change Role
															</DropdownMenuItem>
															<DropdownMenuItem>
																View Profile
															</DropdownMenuItem>
															<DropdownMenuItem className="text-destructive">
																Remove from Team
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="projects" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Team Projects</CardTitle>
									<CardDescription>
										All projects managed by this team
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{teamProjects.map((project) => (
											<div
												key={project.id}
												className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-4"
											>
												<div className="space-y-1">
													<Link
														href={`/projects/${project.id}`}
														className="font-medium hover:text-primary"
													>
														{project.name}
													</Link>
													<p className="text-sm text-muted-foreground">
														{project.completed} of{" "}
														{project.tasks} tasks
														completed
													</p>
												</div>
												<div className="flex items-center gap-3">
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
													<div className="text-right">
														<p className="text-sm font-medium">
															{Math.round(
																(project.completed /
																	project.tasks) *
																	100
															)}
															%
														</p>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="settings" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle>Team Settings</CardTitle>
									<CardDescription>
										Manage team preferences and permissions
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<label className="text-sm font-medium">
											Team Name
										</label>
										<input
											type="text"
											defaultValue="Design Team"
											className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
										/>
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium">
											Description
										</label>
										<textarea
											defaultValue="UI/UX and visual design team"
											className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
											rows={3}
										/>
									</div>
									<div className="flex gap-2">
										<Button>Save Changes</Button>
										<Button
											variant="outline"
											className="bg-transparent"
										>
											Cancel
										</Button>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</main>
		</div>
	);
}
