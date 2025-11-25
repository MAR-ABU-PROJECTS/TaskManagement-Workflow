import React from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const Activity = () => {
  const activityLog = [
    {
      id: 1,
      user: "John Doe",
      action: "changed status to",
      value: "In Progress",
      timestamp: "3 hours ago",
    },
    {
      id: 2,
      user: "Jane Smith",
      action: "added",
      value: "Sarah Williams",
      timestamp: "5 hours ago",
    },
    {
      id: 3,
      user: "John Doe",
      action: "created this task",
      value: "",
      timestamp: "1 day ago",
    },
  ];
	return (
		<Card>
			<CardHeader>
				<CardTitle>Activity</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{activityLog.map((activity) => (
						<div key={activity.id} className="flex gap-3 text-sm">
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
								<div className="h-2 w-2 rounded-full bg-primary" />
							</div>
							<div className="flex-1">
								<p className="text-muted-foreground">
									<span className="font-medium text-foreground">
										{activity.user}
									</span>{" "}
									{activity.action}{" "}
									{activity.value && (
										<span className="font-medium text-foreground">
											{activity.value}
										</span>
									)}
								</p>
								<p className="text-xs text-muted-foreground">
									{activity.timestamp}
								</p>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
};

export default Activity;
