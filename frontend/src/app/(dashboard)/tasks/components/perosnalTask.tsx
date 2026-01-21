import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import React from "react";
import { BoardTask } from "../../projects/lib/type";
import { getPriorityColor, getStatusIcon } from "../lib/utils";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

const PerosnalTask = (task: BoardTask) => {
	const taskMembers = task.assignees?.map((m) => ({
		name: m.user.name,
		id: m.user.id,
	}));
	// const { first, last } = getInitials(task.assignees?.[0].);

  const dueDate = task.dueDate
  ? format(new Date(task.dueDate), "yyyy-MM-dd")
  : "";
	return (
		<Link href={`/tasks/${task.id}`} className="inline-block w-full">
			<Card className="hover:border-primary/50 transition-colors cursor-pointer">
				<CardContent className="p-4">
					<div className="flex items-center gap-4 justify-between">
						<div className="flex items-center gap-3 flex-1">
							{getStatusIcon(task.status)}
							<div className="flex-1 space-y-1">
								<div className="flex items-center gap-2">
									<h3 className="font-medium">
										{task.title}
									</h3>
									<Badge
										className={`text-[11px]! ${getPriorityColor(task.priority)} capitalize`}
									>
										{task.priority.toLowerCase()}
									</Badge>
								</div>
								<p className="text-sm text-muted-foreground">
									{task.description}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-6">
							{taskMembers && taskMembers.length > 0 && (
								<div className="flex -space-x-2">
									{taskMembers.slice(0, 3).map((member) => (
										<MembersInitials
											key={member.id}
											name={member.name}
										/>
									))}

									{taskMembers.length > 3 && (
										<div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium">
											+{taskMembers.length - 3}
										</div>
									)}
								</div>
							)}
							{taskMembers?.length === 1 && (
								<div className="flex items-center">
									<span className="text-sm text-muted-foreground">
										{task?.assignees?.[0]?.user?.name}
									</span>
								</div>
							)}

							

							<div className="text-sm text-muted-foreground text-right">
								Due: {dueDate}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
};

export default PerosnalTask;

const MembersInitials = ({ name }: { name: string }) => {
	const { first, last } = getInitials(name);
	return (
		<div>
			<Avatar className="h-8 w-8 border-2 border-card">
				<AvatarFallback className="text-xs uppercase">
					{first}
					{last}
				</AvatarFallback>
			</Avatar>
		</div>
	);
};
