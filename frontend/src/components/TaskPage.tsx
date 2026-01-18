"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	getPriorityColor,
	getStatusIcon,
	tasks,
} from "@/app/(dashboard)/tasks/lib/utils";
import { QueryStateHandler } from "./QueryStateHandler";
import { useGetPersonalTasks } from "@/app/(dashboard)/tasks/lib/queries";

export default function TasksPage() {
	const query = useGetPersonalTasks();
	// console.log(query.data);
	return (
		<div className="flex flex-1 flex-col px-4 p-6">
			{/* Header */}
			{/* Main Content */}
			<main className="flex-1 overflow-auto">
				<div className="flex items-center gap-2">
					<div className="ml-auto flex items-center gap-2">
						<div className="relative">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search tasks..."
								className="w-64 pl-8"
							/>
						</div>
						<Button
							size="sm"
							variant="outline"
							className="bg-transparent"
						>
							<Filter className="mr-2 h-4 w-4" />
							Filter
						</Button>
						<Button size="sm" asChild>
							<Link href={"/tasks/new"}>
								<Plus className="mr-2 h-4 w-4" />
								New Task
							</Link>
						</Button>
					</div>
				</div>

				<div className="mx-auto space-y-6">
					{/* Filter Tabs */}
					<Tabs defaultValue="all" className="w-full">
						<TabsList>
							<TabsTrigger value="all">All Tasks</TabsTrigger>
							<TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
							<TabsTrigger value="in-progress">
								In Progress
							</TabsTrigger>
							<TabsTrigger value="review">Review</TabsTrigger>
						</TabsList>
					</Tabs>

					{/* Tasks List */}

					<QueryStateHandler
						query={query}
						emptyMessage="No Projects."
						getItems={(res) => res}
						render={(res) => {
							// const data = res.data ?? [];
							console.log({res})

							return (
								<>
								<h1>hello</h1>
									{/* {data.map((project) => {
										const { key, ...rest } = project;
										void key;
										return (
											<Projectitem
												key={project.id}
												{...rest}
											/>
										);
									})} */}
								</>
							);
						}}
					/> 
					<div className="space-y-3.5">
						{tasks.map((task) => (
							<Link
								key={task.id}
								href={`/tasks/${task.id}`}
								className="inline-block w-full"
							>
								<Card className="hover:border-primary/50 transition-colors cursor-pointer">
									<CardContent className="p-4">
										<div className="flex items-center gap-4 justify-between">
											<div className="flex items-center gap-3 flex-1">
												{getStatusIcon(task.status)}
												<div className="flex-1 space-y-1">
													<div className="flex items-center gap-2">
														<h3 className="font-medium">
															{task.title}
														</h3>
														<Badge
															variant={getPriorityColor(
																task.priority
															)}
															className="text-xs"
														>
															{task.priority}
														</Badge>
													</div>
													<p className="text-sm text-muted-foreground">
														{task.project}
													</p>
												</div>
											</div>

											<div className="flex items-center gap-6">
												<div className="flex items-center gap-2">
													<Avatar className="h-7 w-7">
														<AvatarFallback className="text-xs">
															{
																task.assignee
																	.avatar
															}
														</AvatarFallback>
													</Avatar>
													<span className="text-sm text-muted-foreground">
														{task.assignee.name}
													</span>
												</div>

												<div className="w-32">
													<div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
														<span>Progress</span>
														<span>
															{task.progress}%
														</span>
													</div>
													<div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
														<div
															className="h-full bg-primary transition-all"
															style={{
																width: `${task.progress}%`,
															}}
														/>
													</div>
												</div>

												<div className="text-sm text-muted-foreground text-right">
													Due {task.dueDate}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
