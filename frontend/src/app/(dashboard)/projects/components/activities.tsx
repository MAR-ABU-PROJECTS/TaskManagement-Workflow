"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryStateHandler } from "@/components/QueryStateHandler";
import { useGetActivities } from "../../tasks/lib/queries";
import { useParams } from "next/navigation";
import Activity, { TaskActivityType } from "./activity";

const Activities = () => {
	const { taskId } = useParams();

	const query = useGetActivities(taskId as string);

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
