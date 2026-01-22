import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, Flag, User } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ReactSelect from "react-select";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { useDeadlineCountdown } from "@/hooks/useDeadlineCountdowon";

const TaskDetails = ({
	assignees,
	priority,
	status,
	dueDate,
}: {
	assignees: { name: string; id: string }[];
	priority: string;
	status: string;
	dueDate: string | null;
}) => {
	type MembersOption = {
		value: string;
		label: string;
	};

	const options: { value: string; label: string }[] = assignees.map((u) => ({
		value: u?.id,
		label: u?.name,
	}));

	const formattedDate = dueDate ? format(dueDate, "yyyy-MM-dd") : null;

	const countdown = useDeadlineCountdown(dueDate ?? "");
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Task Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{countdown && (
						<p
							className={`text-sm font-medium  ${
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
					<div className="space-y-2">
						<Label className="flex items-center gap-2 text-sm font-medium">
							<User className="h-4 w-4" />
							Assignee
						</Label>
						<div>
							<div className="w-full">
								<ReactSelect<MembersOption, true>
									isMulti
									value={options}
									isDisabled={true}
								/>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label className="flex items-center gap-2 text-sm font-medium">
							<Flag className="h-4 w-4" />
							Priority
						</Label>
						<Select defaultValue={priority.toLowerCase()} disabled>
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
						<Select defaultValue={status.toLowerCase()} disabled>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="backlog">Backlog</SelectItem>
								<SelectItem value="assigned">
									Assigned
								</SelectItem>
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

						<Input
							type="date"
							defaultValue={
								formattedDate ? formattedDate : "2026"
							}
							disabled
						/>
					</div>
				</CardContent>
			</Card>

			{/* <Card>
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
			</Card> */}
		</div>
	);
};

export default TaskDetails;
