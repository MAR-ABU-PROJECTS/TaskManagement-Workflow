"use client";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import { ExternalLink, MoreVertical } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ProjectType } from "../lib/type";
import { useDeleteProject } from "../lib/mutations";
import { RoleBadge } from "@/components/ui/role-badge";
import { Role } from "@/lib/rolespermissions";
import { format } from "date-fns";
import { useDeadlineCountdown } from "@/hooks/useDeadlineCountdowon";

const Projectitem = (project: ProjectType) => {
	const [confirm, setConfirm] = useState(false);
	const deleteMutation = useDeleteProject();

	const handleDelete = async (id: string) => {
		try {
			await deleteMutation.mutateAsync(id);
		} catch (err) {
			void err;
		} finally {
			setConfirm(false);
		}
	};

	const formattedDate = format(project.createdAt, "yyyy-MM-dd");
	const dueDate = project.dueDate
		? format(project.dueDate, "yyyy-MM-dd")
		: "";

	const countdown = useDeadlineCountdown(project.dueDate ?? "");
	return (
		<div>
			<Card className="hover:border-primary/50 transition-colors">
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<CardTitle className="text-base">
								<Link
									href={`/projects/${project.id}`}
									className="hover:text-primary flex items-center gap-1.5"
								>
									{project.name}{" "}
									<ExternalLink className="size-4" />
								</Link>
							</CardTitle>
							<CardDescription className="mt-1 text-sm">
								{project.description}
							</CardDescription>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
								>
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>
									<Link href={`/projects/${project.id}/edit`}>
										Edit Project
									</Link>
								</DropdownMenuItem>

								<DropdownMenuItem
									className="text-destructive"
									onClick={() => setConfirm(true)}
								>
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardHeader>
				<CardContent className="flex gap-4 flex-col">
					<div>
						<h2 className="text-sm text-black font-[500]">
							Created By
						</h2>
						<p className="text-base">
							<span className="mr-1.5 text-gray-600">
								{project.creator.name}{" "}
							</span>
							<RoleBadge role={project.creator.role as Role} />
						</p>
					</div>

					<div className="flex gap-5 items-center justify-between">
						<div>
							<h2 className="text-sm text-black font-[500]">
								Created At
							</h2>
							<p className="text-sm">
								<span className="mr-1.5 text-gray-600">
									{formattedDate}
								</span>
							</p>
						</div>

						<div>
							{/* <h2 className="text-sm text-black font-[500]">
								Due By
							</h2>
							<p className="text-sm">
								<span className="mr-1.5 text-gray-600">
									{dueDate}
								</span>
							</p> */}

							<h2 className="text-sm text-black font-[500]">
								Due By
							</h2>

							<p className="text-sm text-gray-600">
								{dueDate || "—"}
							</p>
						</div>
						{countdown && (
							<p
								className={`text-sm font-medium mt-0.5 ${
									countdown === "Overdue"
										? "text-destructive"
										: "text-primary"
								}`}
							>
								{countdown === "Overdue"
									? "Overdue"
									: `Due in ${countdown}`}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			<AlertDialog open={confirm} onOpenChange={setConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Project</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete &quot;{project.name}
							&quot;? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="flex gap-2 justify-end">
						<Button
							onClick={() => setConfirm(false)}
							disabled={deleteMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={() => handleDelete(project.id)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending && (
								<Spinner className="mr-1.5" />
							)}
							Delete
						</Button>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default Projectitem;
