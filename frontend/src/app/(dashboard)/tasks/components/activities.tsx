"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryStateHandler } from "@/components/QueryStateHandler";
import { useGetActivities } from "../lib/queries";
import { useParams } from "next/navigation";
import Activity, { TaskActivityType } from "./activity";

const Activities = () => {
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

	const { taskId } = useParams();

	const query = useGetActivities(taskId as string);
	console.log(query.data);
	return (
		<Card>
			<CardHeader>
				<CardTitle>Activity</CardTitle>
			</CardHeader>
			<CardContent>
				<QueryStateHandler
					query={query}
					emptyMessage="No Activities."
					getItems={(res) => res}
					render={(res) => {
						const data = (res.data as TaskActivityType[]) ?? [];

						return (
							<div className="max-h-[300px] overflow-y-auto w-full space-y-4">
								{data.map((p) => (
									<Activity key={p.id} {...p} />
								))}
							</div>
						);
					}}
				/>
			</CardContent>
		</Card>
	);
};

export default Activities;
