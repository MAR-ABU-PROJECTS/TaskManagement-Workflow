"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TaskComments from "@/app/(dashboard)/tasks/components/comments";
import Activity from "@/app/(dashboard)/tasks/components/activities";
// import Attachments from "@/app/(dashboard)/tasks/components/attachments";
import Subtasks from "@/app/(dashboard)/tasks/components/subtasks";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import TaskDetails from "./Task-details";
import { useRouter } from "next/navigation";
import { QueryStateHandler } from "@/components/QueryStateHandler";
import { useGetTaskDetails } from "../../tasks/lib/queries";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteTaskProject } from "../../tasks/lib/mutation";
import Attachments from "./attachments";

export default function TaskDetailPage({ taskId }: { taskId: string }) {
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const router = useRouter();
	const query = useGetTaskDetails(taskId);
	const mutation = useDeleteTaskProject("1");

	return (
		<div className="px-4 p-6">
			{/* Header */}
			<button
				className="outline-none flex items-center mb-6"
				onClick={() => router.back()}
			>
				<ChevronLeft className="mr-1.5" /> Back
			</button>
			<QueryStateHandler
				query={query}
				emptyMessage="Task Not found."
				getItems={(res) => res}
				render={(res) => {
					const data = res.data;

					const assignees = data.assignees.map((u) => ({
						id: u?.user?.id,
						name: u?.user?.name,
					}));

					console.log({ assignees, data });

					return (
						<div className="flex flex-1 flex-col">
							<div className="flex items-center mb-3">
								<div className="flex items-center gap-3 flex-1">
									<h1 className="text-lg font-semibold">
										{data.title}
									</h1>
									<Badge variant="secondary">
										{data.status.toLowerCase()}
									</Badge>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											size="sm"
											variant="outline"
											className="bg-transparent"
										>
											<MoreVertical className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem>
											<button
												className="w-full f-full outline-none focus:outline-none text-left"
												onClick={() =>
													setShowDeleteModal(true)
												}
											>
												Delete Task
											</button>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							{/* Main Content */}
							<main className="flex-1 overflow-auto">
								<div className="grid lg:grid-cols-3 gap-6">
									{/* Left Column - Main Content */}
									<div className="lg:col-span-2 space-y-6">
										{/* Description */}
										<Card>
											<CardHeader>
												<CardTitle>
													Description
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-sm text-muted-foreground leading-relaxed">
													{data.description}
												</p>
											</CardContent>
										</Card>

										<Subtasks />

										<Attachments />

										<TaskComments />

										<Activity />
									</div>

									<TaskDetails
										assignees={assignees}
										priority={data.priority}
										status={data.status}
									/>
								</div>
							</main>
							<Dialog
								open={showDeleteModal}
								onOpenChange={setShowDeleteModal}
							>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Delete Task</DialogTitle>
										<DialogDescription>
											Are you sure you want to delete this
											task? This action cannot be undone.
										</DialogDescription>
									</DialogHeader>
									<div className="flex justify-end gap-4">
										<Button
											type="button"
											variant="outline"
											onClick={() =>
												setShowDeleteModal(true)
											}
											disabled={mutation.isPending}
											className="border-slate-200 dark:border-slate-800 bg-transparent"
										>
											Cancel
										</Button>
										<Button
											type="submit"
											disabled={mutation.isPending}
											className="bg-primary hover:bg-primary/90 text-white"
											onClick={() =>
												mutation.mutate(taskId, {
													onSuccess() {
														setShowDeleteModal(
															false
														);
													},
												})
											}
										>
											{mutation.isPending && (
												<Spinner className="mr-1.5" />
											)}
											Delete
										</Button>
									</div>
								</DialogContent>
							</Dialog>
						</div>
					);
				}}
			/>
		</div>
	);
}
