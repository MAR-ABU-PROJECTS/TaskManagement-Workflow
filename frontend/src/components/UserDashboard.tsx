import React from "react";
import { QueryStateHandler } from "./QueryStateHandler";
import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from "./ui/card";
import { AlertCircle, CheckCircle2, Clock, FolderKanban } from "lucide-react";
import { apiService } from "@/lib/apiService";
import Link from "next/link";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { getPriorityColor } from "@/app/(dashboard)/projects/lib/utils";

const UserDashboard = () => {
	const query = useQuery<DashboardOverview>({
		queryKey: ["user-dashboard"],
		queryFn: () => {
			return apiService.get("/dashboard/overview");
		},
		meta: { disableGlobalSuccess: true },
	});
	return (
		<div>
			<QueryStateHandler
				query={query}
				emptyMessage="No Data Found"
				getItems={(res) => res}
				render={(res) => {
					const data = res;

					return (
						<div>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Active Projects
										</CardTitle>
										<FolderKanban className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{data.activeProjectsCount}
										</div>
										{/* <p className="text-xs text-muted-foreground">
											<span className="text-primary">
												+2
											</span>{" "}
											from last month
										</p> */}
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Tasks in Progress
										</CardTitle>
										<Clock className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{data.myTasks.length}
										</div>
										{/* <p className="text-xs text-muted-foreground">
											<span className="text-primary">
												+12
											</span>{" "}
											from last week
										</p> */}
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Completed Tasks
										</CardTitle>
										<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{data.completedTasksCount}
										</div>
										{/* <p className="text-xs text-muted-foreground">
											<span className="text-primary">
												+18%
											</span>{" "}
											from last month
										</p> */}
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium">
											Open Issues
										</CardTitle>
										<AlertCircle className="h-4 w-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{data.openIssuesCount}
										</div>
										{/* <p className="text-xs text-muted-foreground">
											<span className="text-destructive">
												+3
											</span>{" "}
											from yesterday
										</p> */}
									</CardContent>
								</Card>
							</div>
							<div className="grid gap-6 lg:grid-cols-2 mt-5">
								{/* Recent Projects */}
								<Card>
									<CardHeader>
										<CardTitle>Recent Projects</CardTitle>
										<CardDescription>
											Your most recently updated projects
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										{data.recentProjects
											.slice(0, 3)
											.map((project) => (
												<div
													key={project.name}
													className="flex items-center justify-between"
												>
													<div className="space-y-1">
														<p className="text-sm font-medium leading-none">
															{project.name}
														</p>
														<p className="text-sm text-muted-foreground">
															{/* {project.} */}
														</p>
													</div>
													<div className="flex items-center gap-2">
														<div className="text-right">
															<p className="text-sm font-medium">
																{
																	project.progress
																}
																%
															</p>
															<p className="text-xs text-muted-foreground">
																{/* {project.} */}
															</p>
														</div>
													</div>
												</div>
											))}

										<Button
											variant="outline"
											className="w-full bg-transparent"
											size={"lg"}
											asChild
										>
											<Link href="/projects">
												View All Projects
											</Link>
										</Button>
									</CardContent>
								</Card>

								{/* My Tasks */}
								<Card>
									<CardHeader>
										<CardTitle>My Tasks</CardTitle>
										<CardDescription>
											Tasks assigned to you
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										{data.myTasks
											.slice(0, 3)
											.map((task) => (
												<div
													key={task.id}
													className="flex items-start justify-between"
												>
													<div className="space-y-1">
														<p className="text-sm font-medium leading-none">
															{task.title}
														</p>
														<p className="text-sm text-muted-foreground">
															{/* {task.project} */}
														</p>
													</div>
													<div className="text-right">
														<Badge
															variant="outline"
															className={`text-[11px]! ${getPriorityColor(task?.priority ?? "")} capitalize`}
														>
															{task?.priority?.toLowerCase()}
														</Badge>
														<p className="mt-1 text-xs text-muted-foreground">
															{task.dueDate}
														</p>
													</div>
												</div>
											))}

										<Button
											variant="outline"
											className="w-full bg-transparent"
											size={"lg"}
											asChild
										>
											<Link href="/tasks">
												View All Tasks
											</Link>
										</Button>
									</CardContent>
								</Card>
							</div>
						</div>
					);
				}}
			/>
		</div>
	);
};

export default UserDashboard;

export type DashboardOverview = {
	activeProjectsCount: number;
	completedTasksCount: number;
	openIssuesCount: number;

	myTasks: Task[];

	recentProjects: Project[];
};
export type Project = {
	id: string;
	name: string;
	key: string;
	description: string;
	creatorName: string;

	totalTasks: number;
	completedTasks: number;
	progress: number;

	updatedAt: string; // ISO date string
};

export type Task = {
	id: string;
	title: string;
	status: "OPEN" | "IN_PROGRESS" | "DONE" | string;
	priority?: "LOW" | "MEDIUM" | "HIGH" | string;

	projectId?: string;
	dueDate?: string;
	createdAt?: string;
};
