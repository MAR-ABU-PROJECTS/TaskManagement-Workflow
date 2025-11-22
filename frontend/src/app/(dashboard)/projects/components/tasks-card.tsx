"use client";
import React from "react";
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
	GripVertical,
	MessageSquare,
	MoreVertical,
	Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPriorityColor } from "../lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TaskCardProps } from "../type";

const TaskCard = ({
	id,
	title,
	description,
	priority,
	assignee,
	comments,
	attachments,
	onEdit,
	onChangeStatus,
	onAssign,
	onDelete,
}: TaskCardProps) => {
	return (
		<div>
			<Card
				key={id}
				className="cursor-pointer hover:border-primary/50 transition-colors"
			>
				<CardHeader className="p-4">
					<div className="flex items-start justify-between gap-2">
						<div className="flex items-start gap-2">
							<GripVertical className="mt-0.5 h-4 w-4 text-muted-foreground" />
							<div className="flex-1">
								<CardTitle className="text-sm font-medium leading-tight">
									{title}
								</CardTitle>
								{description && (
									<CardDescription className="mt-1 text-xs">
										{description}
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
								<DropdownMenuItem onClick={() => onEdit(id)}>
									Edit Task
								</DropdownMenuItem>

								<DropdownMenuItem
									onClick={() => onChangeStatus(id)}
								>
									Change Status
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onAssign(id)}>
									Assign to
								</DropdownMenuItem>

								<DropdownMenuItem>
									<Button
										variant={"destructive"}
										onClick={() => onDelete(id)}
									>
										Delete
									</Button>
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
								className={`text-xs ${getPriorityColor(
									priority
								)}`}
							>
								{priority}
							</Badge>
							<Avatar className="h-5 w-5">
								<AvatarFallback className="text-xs">
									{assignee}
								</AvatarFallback>
							</Avatar>
						</div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							{comments > 0 && (
								<div className="flex items-center gap-1">
									<MessageSquare className="h-3 w-3" />
									<span>{comments}</span>
								</div>
							)}
							{attachments > 0 && (
								<div className="flex items-center gap-1">
									<Paperclip className="h-3 w-3" />
									<span>{attachments}</span>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default TaskCard;
