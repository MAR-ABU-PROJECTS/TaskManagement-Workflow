"use client";
import React from "react";
import { QueryStateHandler } from "./QueryStateHandler";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/apiService";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { AlertCircle, CheckCircle2, Clock, FolderKanban } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

const AdminDashboard = () => {
	const query = useQuery({
		queryKey: ["admin-dashboard"],
		queryFn: () => {
			return apiService.get("/users/dashboard/overview");
		},
		meta: { disableGlobalSuccess: true },
	});

	console.log(query.data);
	return (
		<div>
			<QueryStateHandler
				query={query}
				emptyMessage="No Data Found"
				getItems={(res) => res}
				render={(res) => {
					// const data = res.users ?? [];
					// const pages = res.data?.pagination?.pages ?? 0;

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
											12
										</div>
										<p className="text-xs text-muted-foreground">
											<span className="text-primary">
												+2
											</span>{" "}
											from last month
										</p>
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
											48
										</div>
										<p className="text-xs text-muted-foreground">
											<span className="text-primary">
												+12
											</span>{" "}
											from last week
										</p>
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
											234
										</div>
										<p className="text-xs text-muted-foreground">
											<span className="text-primary">
												+18%
											</span>{" "}
											from last month
										</p>
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
											7
										</div>
										<p className="text-xs text-muted-foreground">
											<span className="text-destructive">
												+3
											</span>{" "}
											from yesterday
										</p>
									</CardContent>
								</Card>
							</div>
							<div className="grid gap-6 lg:grid-cols-2">
								{/* Recent Projects */}
								<Card>
									<CardHeader>
										<CardTitle>Recent Projects</CardTitle>
										<CardDescription>
											Your most recently updated projects
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										{[
											{
												name: "Website Redesign",
												team: "Design Team",
												progress: 75,
												status: "On Track",
											},
											{
												name: "Mobile App Development",
												team: "Engineering",
												progress: 45,
												status: "In Progress",
											},
											{
												name: "Marketing Campaign Q1",
												team: "Marketing",
												progress: 90,
												status: "Almost Done",
											},
										].map((project) => (
											<div
												key={project.name}
												className="flex items-center justify-between"
											>
												<div className="space-y-1">
													<p className="text-sm font-medium leading-none">
														{project.name}
													</p>
													<p className="text-sm text-muted-foreground">
														{project.team}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<div className="text-right">
														<p className="text-sm font-medium">
															{project.progress}%
														</p>
														<p className="text-xs text-muted-foreground">
															{project.status}
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
										{[
											{
												title: "Update landing page design",
												project: "Website Redesign",
												priority: "High",
												dueDate: "Today",
											},
											{
												title: "Review pull request #234",
												project: "Mobile App",
												priority: "Medium",
												dueDate: "Tomorrow",
											},
											{
												title: "Prepare Q1 report",
												project: "Marketing Campaign",
												priority: "Low",
												dueDate: "Next Week",
											},
										].map((task) => (
											<div
												key={task.title}
												className="flex items-start justify-between"
											>
												<div className="space-y-1">
													<p className="text-sm font-medium leading-none">
														{task.title}
													</p>
													<p className="text-sm text-muted-foreground">
														{task.project}
													</p>
												</div>
												<div className="text-right">
													<span
														className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
															task.priority ===
															"High"
																? "bg-destructive/10 text-destructive"
																: task.priority ===
																	  "Medium"
																	? "bg-primary/10 text-primary"
																	: "bg-muted text-muted-foreground"
														}`}
													>
														{task.priority}
													</span>
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

export default AdminDashboard;
