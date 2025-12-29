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
import Attachments from "@/app/(dashboard)/tasks/components/attachments";
import Subtasks from "@/app/(dashboard)/tasks/components/subtasks";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import TaskDetails from "@/app/(dashboard)/tasks/components/task-details";
import { useRouter } from "next/navigation";

export default function TaskDetailPage() {
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const router = useRouter();
	return (
		<div className="flex flex-1 flex-col px-4 p-6">
			{/* Header */}
			<div className="flex items-center mb-3">
				<div className="flex items-center gap-3 flex-1">
					<button
						className="outline-none"
						onClick={() => router.back()}
					>
						<ChevronLeft />
					</button>
					<h1 className="text-lg font-semibold">
						Design homepage mockup
					</h1>
					<Badge variant="secondary">In Progress</Badge>
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
						{/* <DropdownMenuItem>Duplicate Task</DropdownMenuItem> */}
						<DropdownMenuItem>Convert to Issue</DropdownMenuItem>
						<DropdownMenuItem>Move to Project</DropdownMenuItem>
						<DropdownMenuItem>
							<button
								className="w-full f-full outline-none focus:outline-none text-left"
								onClick={() => setShowDeleteModal(true)}
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
								<CardTitle>Description</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground leading-relaxed">
									Create a high-fidelity mockup for the new
									homepage design. The mockup should include
									the hero section.
								</p>
							</CardContent>
						</Card>

						{/* Subtasks */}
						<Subtasks />
						{/* Attachments */}
						<Attachments />
						{/* Comments */}
						<TaskComments />
						{/* Activity Log */}
						<Activity />
					</div>

					{/* Right Column - Task Details */}
					<TaskDetails />
				</div>
			</main>

			<Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Task</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this task? This
							action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteModal(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => setShowDeleteModal(false)}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
