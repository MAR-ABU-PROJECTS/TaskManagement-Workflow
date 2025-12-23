"use client";
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
import { Minus, MoreVerticalIcon, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AddMemberModal from "./add-member-modal";
import RemoveMembers from "./remove-member";

const Members = ({ projectId }: { projectId: string }) => {
	const q = useGetProjectsMembers(projectId);

	const [openModal, setOpenModal] = useState<
		"add member" | "remove member" | null
	>(null);

	const [selectedusers, setSelectedUsers] = useState<string[]>([]);

	const toggleSelectedUsers = (id: string) => {
		setSelectedUsers((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	};

	const resetSelectedUsers = () => {
		setSelectedUsers([]);
	};

	return (
		<div className=",t-4">
			<Card>
				<CardHeader>
					<CardTitle>Project Members</CardTitle>
					<CardDescription className="flex w-full justify-between items-center gap-4 flex-wrap">
						<p>Manage Project members</p>

						<div className="flex justify-between items-center gap-4 flex-wrap">
							<Button
								size={"sm"}
								onClick={() => setOpenModal("add member")}
							>
								<Plus className="mr-1.5" />
								Add Members to Project
							</Button>

							{selectedusers.length > 0 && (
								<Button
									size={"sm"}
									onClick={() =>
										setOpenModal("remove member")
									}
									variant={"destructive"}
								>
									<Minus className="mr-1.5" />
									Remove From Project
								</Button>
							)}
						</div>
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
											<div className="flex items-center gap-4">
												<input
													type="checkbox"
													onChange={() =>
														toggleSelectedUsers(
															member.user.id
														)
													}
													checked={selectedusers.includes(
														member.user.id
													)}
													className="size-4 accent-primary"
												/>
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
															asChild
														>
															<Link
																href={`/user-management/${member.id}`}
															>
																View Profile
															</Link>
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

			<AddMemberModal
				isOpen={openModal === "add member"}
				toggleSelectedUsers={toggleSelectedUsers}
				onClose={() => {
					resetSelectedUsers();
					setOpenModal(null);
				}}
				projectId={projectId}
				selectedUsers={selectedusers}
				// resetSelectedUsers={resetSelectedUsers}
			/>

			<RemoveMembers
				isOpen={openModal === "remove member"}
				onClose={() => {
					resetSelectedUsers();
					setOpenModal(null);
				}}
				projectId={projectId}
				selectedUsers={selectedusers}
				// resetSelectedUsers={resetSelectedUsers}
			/>
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
		role: string;
	};
};
