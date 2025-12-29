import { formatTimeStamp } from "@/lib/utils";
import React from "react";

const Activity = (activity: TaskActivityType) => {
	return (
		<div className="flex gap-3 text-sm">
			<div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
				<div className="h-2 w-2 rounded-full bg-primary" />
			</div>
			<div className="flex-1">
				<p className="text-muted-foreground">
					<span className="font-medium text-foreground">
						{activity.user?.name}
					</span>{" "}
					{activity.action}{" "}
					{activity && (
						<span className="font-medium text-foreground">
							{/* {activity.value} */}
						</span>
					)}
				</p>
				<p className="text-xs text-muted-foreground">
					{formatTimeStamp(activity.timestamp)}
				</p>
			</div>
		</div>
	);
};

export default Activity;

export type TaskActivityType = {
	id: string;
	taskId: string;
	userId: string;
	action: "COMMENT" | "CREATE" | "UPDATE" | "DELETE";
	previousStatus: string | null;
	newStatus: string | null;
	timestamp: string;
	user?: {
		id: string;
		name: string;
		email: string;
		role: string;
	};
};
