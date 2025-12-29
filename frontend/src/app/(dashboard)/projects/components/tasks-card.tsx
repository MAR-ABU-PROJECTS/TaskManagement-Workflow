"use client";
import React, { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	ExternalLink,
	GripVertical,
	MessageSquare,
	MoreVertical,
	Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPriorityColor } from "../lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BoardTask } from "../lib/type";
import Link from "next/link";
import { DeleteTaskModal } from "./delete-task-modal";
import { EditTaskModal } from "./edit-task-modal";
import { ChangeStatusModal } from "./change-status-modal";
import { getInitials } from "@/lib/utils";

const TaskCard = ({
	task,
	projectId,
}: {
	task: BoardTask;
	projectId: string;
}) => {
	const [openModal, setOpenModal] = useState<
		"edit" | "status" | "delete" | "add" | null
	>(null);

	const name = task?.assignee?.name ?? "";
	const { first, last } = getInitials(name);

	return (
		<div>
			<Card
				key={task.id}
				className="cursor-pointer hover:border-primary/50 transition-colors"
			>
				<CardHeader className="p-4">
					<div className="flex items-start justify-between gap-2">
						<div className="flex items-start gap-2">
							<GripVertical className="mt-0.5 h-4 w-4 text-muted-foreground" />
							<div className="flex-1">
								<CardTitle className="text-sm font-medium leading-tight ">
									<Link
										href={`/projects/${projectId}/task/${task.id}`}
										className="inline-flex items-center gap-3"
									>
										{task.title}{" "}
										<span>
											<ExternalLink className="size-4" />
										</span>
									</Link>
								</CardTitle>
								{task.description && (
									<CardDescription className="mt-1 text-xs line-clamp-3 text-wrap break-all">
										{task.description}
									</CardDescription>
								)}
							</div>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
								>
									<MoreVertical className="h-3 w-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => setOpenModal("edit")}
								>
									Edit Task
								</DropdownMenuItem>

								<DropdownMenuItem
									onClick={() => setOpenModal("status")}
								>
									Change Status
								</DropdownMenuItem>

								<DropdownMenuItem>
									<button
										onClick={() => setOpenModal("delete")}
										className="w-full text-left h-full outline-none focus:outline-none"
									>
										Delete
									</button>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardHeader>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className={`text-[11px]! ${getPriorityColor(task.priority)} capitalize`}
							>
								{task.priority.toLowerCase()}
							</Badge>
							{task.assignee && (
								<Avatar className="h-5 w-5 flex justify-center items-center">
									<AvatarFallback className="text-[14px] uppercase">
										{first} {last}
									</AvatarFallback>
								</Avatar>
							)}
						</div>
						<Link href={`/tasks/${task.id}`}>
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<div className="flex items-center gap-1">
									<MessageSquare className="h-3 w-3" />
									{/* <span>{comment}</span> */}
								</div>

								<div className="flex items-center gap-1">
									<Paperclip className="h-3 w-3" />
									{/* <span>{task.}</span> */}
								</div>
							</div>
						</Link>
					</div>
				</CardContent>
			</Card>

			<DeleteTaskModal
				isOpen={openModal === "delete"}
				onClose={() => setOpenModal(null)}
				title={task.title}
				id={task.id}
			/>

		

			<EditTaskModal
				projectId={projectId}
				isOpen={openModal === "edit"}
				onClose={() => setOpenModal(null)}
				task={task}
			/>

			<ChangeStatusModal
				isOpen={openModal === "status"}
				onClose={() => setOpenModal(null)}
				task={task}
				projectId={projectId}
			/>
		</div>
	);
};

export default TaskCard;
