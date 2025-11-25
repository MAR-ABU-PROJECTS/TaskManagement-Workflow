import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Calendar,
	CheckCircle2,
	Clock,
	Flag,
	LinkIcon,
	Plus,
	User,
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const TaskDetails = () => {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Task Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label className="flex items-center gap-2 text-sm font-medium">
							<User className="h-4 w-4" />
							Assignee
						</Label>
						<Select defaultValue="john">
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="john">John Doe</SelectItem>
								<SelectItem value="jane">Jane Smith</SelectItem>
								<SelectItem value="mike">
									Mike Johnson
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label className="flex items-center gap-2 text-sm font-medium">
							<Flag className="h-4 w-4" />
							Priority
						</Label>
						<Select defaultValue="high">
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="critical">
									Critical
								</SelectItem>
								<SelectItem value="high">High</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="low">Low</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label className="flex items-center gap-2 text-sm font-medium">
							<CheckCircle2 className="h-4 w-4" />
							Status
						</Label>
						<Select defaultValue="in-progress">
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="backlog">Backlog</SelectItem>
								<SelectItem value="todo">To Do</SelectItem>
								<SelectItem value="in-progress">
									In Progress
								</SelectItem>
								<SelectItem value="review">Review</SelectItem>
								<SelectItem value="done">Done</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label className="flex items-center gap-2 text-sm font-medium">
							<Calendar className="h-4 w-4" />
							Due Date
						</Label>
						<input
							type="date"
							defaultValue="2025-01-20"
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>

					<div className="space-y-2">
						<Label className="flex items-center gap-2 text-sm font-medium">
							<Clock className="h-4 w-4" />
							Time Estimate
						</Label>
						<input
							type="text"
							defaultValue="8 hours"
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>

					<Separator />

					<div className="space-y-2">
						<Label className="flex items-center gap-2 text-sm font-medium">
							<LinkIcon className="h-4 w-4" />
							Linked Tasks
						</Label>
						<Button
							variant="outline"
							size="sm"
							className="w-full bg-transparent"
						>
							<Plus className="mr-2 h-3 w-3" />
							Link Task
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Time Tracking</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								Time Logged
							</span>
							<span className="font-medium">4h 30m</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								Estimated
							</span>
							<span className="font-medium">8h</span>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
							<div
								className="h-full bg-primary"
								style={{ width: "56%" }}
							/>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="w-full bg-transparent"
					>
						<Clock className="mr-2 h-3 w-3" />
						Log Time
					</Button>
				</CardContent>
			</Card>
		</div>
	);
};

export default TaskDetails;
