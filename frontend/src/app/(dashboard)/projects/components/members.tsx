"use client";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import React, { useState } from "react";
import { useGetProjectsMembers } from "../lib/queries";
import { QueryStateHandler } from "@/components/QueryStateHandler";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVerticalIcon, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGetUsers } from "../../user-management/lib/queries";

const Members = ({ projectId }: { projectId: string }) => {
	const [isOpen, setOpen] = useState(false);
	const [alert, setAlert] = useState(false);
	const q = useGetProjectsMembers(projectId);

	const [selectedUser, setSelectedUser] = useState({
		name: "",
		id: "",
	});

	const [selectedusers, setSelectedUsers] = useState<string[]>([]);
	const users = useGetUsers();

	const toggleSelectedUsers = (id: string) => {
		setSelectedUsers((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	};

	return (
		<div className=",t-4">
			<Card>
				<CardHeader>
					<CardTitle>Project Members</CardTitle>
					<CardDescription className="flex w-full justify-between items-center gap-4 flex-wrap">
						<p>Manage Project members</p>

						<Button size={"sm"} onClick={() => setOpen(true)}>
							<Plus className="mr-1.5" />
							Add Members
						</Button>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<QueryStateHandler
						query={q}
						emptyMessage="members not added yet"
						getItems={(res) => res}
						render={(res) => {
							const data = res as ProjectMember[];
							return (
								<div className="space-y-4">
									{data.map((member) => (
										<div
											key={member.id}
											className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-accent/50"
											onMouseEnter={() => {
												setSelectedUser({
													id: member.user.id,
													name: member.user.name,
												});
											}}
										>
											<div className="flex items-center gap-3">
												<div>
													<p className="text-sm font-medium">
														{member.user.name}
													</p>
													<p className="text-sm text-muted-foreground">
														{member.user.email}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Badge
													// variant={getRoleBadgeVariant(
													// 	member.role
													// )}
													className="lowercase"
												>
													{/* <span className="mr-1">
															{getRoleIcon(
																member.role
															)}
														</span> */}
													{member.role.replace(
														"_",
														" "
													)}
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
															<MoreVerticalIcon className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
														// onClick={() =>
														// 	handleOpenChangeRole(
														// 		member
														// 	)
														// }
														>
															Change Role
														</DropdownMenuItem>
														<DropdownMenuItem
															asChild
														>
															<Link
																href={`/teams/1/members/${member.id}`}
															>
																View Profile
															</Link>
														</DropdownMenuItem>
														<DropdownMenuItem
															className="text-destructive"
															onClick={() =>
																setAlert(true)
															}
														>
															Remove from Project
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									))}
								</div>
							);
						}}
					/>
				</CardContent>
			</Card>

			<Dialog open={isOpen} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Members</DialogTitle>
						<DialogDescription>
							Add a new member to your project
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						{users.data?.users.map((u, i) => (
							<div
								className="flex justify-between items-center p-2 border border-gray-400 rounded-[8px]"
								key={i}
							>
								<p className="text-sm">{u.name}</p>
								<input
									type="checkbox"
									className="size-4 accent-primary"
									checked={selectedusers.includes(u.id)}
									onChange={() => toggleSelectedUsers(u.id)}
								/>
							</div>
						))}

						<div className="flex justify-end gap-5 mt-5">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								// disabled={taskMutation.isPending}
								className="border-slate-200 dark:border-slate-800 bg-transparent"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								// disabled={taskMutation.isPending}
								className="bg-primary hover:bg-primary/90 text-white"
							>
								{/* {taskMutation.isPending && (
									<Spinner className="mr-1.5" />
								)} */}
								Add Member
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<AlertDialog open={alert} onOpenChange={setAlert}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Member</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove &quot;
							{selectedUser.name} &quot; from this project?. This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="flex justify-end mt-5 gap-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setAlert(false)}
							// disabled={assignMutation.isPending}
							className="border-slate-200 dark:border-slate-800 bg-transparent"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							// disabled={!selectedUser || assignMutation.isPending}
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
							{/* {assignMutation.isPending && (
								<Spinner className="mr-1.5" />
							)} */}
							Delete
						</Button>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default Members;

type ProjectMember = {
	id: string;
	projectId: string;
	userId: string;
	addedById: string;
	role: string;
	user: {
		id: string;
		name: string;
		email: string;
		role: "CEO" | string;
	};
};
