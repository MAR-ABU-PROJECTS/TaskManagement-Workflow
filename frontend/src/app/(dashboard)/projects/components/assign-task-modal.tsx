"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Task } from "../lib/type";

interface AssignTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	task: Task;
	onAssign: (taskId: number, assignee: string) => void;
}

const teamMembers = [
	{ id: 1, name: "John Doe", initials: "JD" },
	{ id: 2, name: "Jane Smith", initials: "JS" },
	{ id: 3, name: "Mike Johnson", initials: "MJ" },
	{ id: 4, name: "Sarah Williams", initials: "SW" },
	{ id: 5, name: "Tom Brown", initials: "TB" },
];

export function AssignTaskModal({
	isOpen,
	onClose,
	task,
	onAssign,
}: AssignTaskModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Assign Task</DialogTitle>
					<DialogDescription>
						Select a team member to assign this task to
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					{teamMembers.map((member) => (
						<Button
							key={member.id}
							variant={
								task?.assignee === member.initials
									? "default"
									: "outline"
							}
							onClick={() => {
								onAssign(task?.id, member.initials);
								onClose();
							}}
							className="w-full justify-start"
						>
							<Avatar className="h-5 w-5 mr-2">
								<AvatarFallback className="text-xs">
									{member.initials}
								</AvatarFallback>
							</Avatar>
							{member.name}
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
