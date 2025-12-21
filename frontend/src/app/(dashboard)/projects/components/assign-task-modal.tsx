"use client";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BoardTask } from "../lib/type";
import { useGetUsers } from "../../user-management/lib/queries";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAssignTaskProject } from "../../tasks/lib/mutation";

interface AssignTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	task: BoardTask;
	onAssign: (taskId: number, assignee: string) => void;
	projectId: string;
}

export function AssignTaskModal({
	isOpen,
	onClose,
	task,
	projectId,
}: AssignTaskModalProps) {
	const users = useGetUsers();
	const [selectedUser, setSelectedUser] = useState(task.assignee?.id ?? "");

	useEffect(() => {
		setSelectedUser(task.assignee?.id ?? "");
	}, [task.assignee, isOpen]);

	const assignMutation = useAssignTaskProject(projectId);
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Assign Task</DialogTitle>
					<DialogDescription>
						Select a member to assign this task to
					</DialogDescription>
				</DialogHeader>
				<div>
					<div className="space-y-2.5">
						{users.data?.users.map((user) => (
							<Button
								key={user.id}
								variant={
									selectedUser === user.id
										? "default"
										: "outline"
								}
								onClick={() => {
									setSelectedUser(user.id);
								}}
								className="w-full justify-between"
							>
								{user.name}
							</Button>
						))}
					</div>
					<div className="flex justify-end mt-5">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={assignMutation.isPending}
							className="border-slate-200 dark:border-slate-800 bg-transparent"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!selectedUser || assignMutation.isPending}
							className="bg-primary hover:bg-primary/90 text-white"
							onClick={() =>
								assignMutation.mutate(
									{
										taskId: task.id,
										assigneeId: selectedUser,
									},
									{
										onSuccess: () => {
											onClose();
										},
									}
								)
							}
						>
							{assignMutation.isPending && (
								<Spinner className="mr-1.5" />
							)}
							Assign
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
