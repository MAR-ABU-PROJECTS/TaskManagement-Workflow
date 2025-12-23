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
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAssignTaskProject } from "../../tasks/lib/mutation";
import { useGetProjectsMembers } from "../lib/queries";

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
	const members = useGetProjectsMembers(projectId);
	console.log(members.data);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

	const toggleSelectedUsers = (id: string) => {
		setSelectedUsers((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	};
	useEffect(() => {
		setSelectedUsers([]);
	}, [task.assignee, isOpen]);

	const assignMutation = useAssignTaskProject(projectId);
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Assign Task</DialogTitle>
					<DialogDescription>
						Select at least one member to assign this task to
					</DialogDescription>
				</DialogHeader>
				<div>
					<div className="space-y-2.5">
						{members.data?.map(
							(u: { user: { id: string; name: string } }) => (
								<Button
									key={u.user.id}
									variant={"outline"}
									className=" justify-between w-full items-center"
								>
									<p> {u.user.name}</p>
									<input
										type="checkbox"
										onChange={() =>
											toggleSelectedUsers(u.user.id)
										}
										className="size-4 accent-primary"
									/>
								</Button>
							)
						)}
					</div>
					<div className="flex justify-end mt-5 gap-4">
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
							disabled={
								!selectedUsers || assignMutation.isPending
							}
							className="bg-primary hover:bg-primary/90 text-white"
							// onClick={() =>
							// 	assignMutation.mutate(
							// 		{
							// 			taskId: task.id,
							// 			assigneeId: selectedUser,
							// 		},
							// 		{
							// 			onSuccess: () => {
							// 				onClose();
							// 			},
							// 		}
							// 	)
							// }
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
