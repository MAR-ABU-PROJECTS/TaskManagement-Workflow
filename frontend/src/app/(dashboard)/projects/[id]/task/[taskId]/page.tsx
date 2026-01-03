import TaskDetailPage from "../../../components/Task-detail";
import React from "react";

type Props = {
	params: { taskId: string };
};
const page = ({ params }: Props) => {
	const taskId = params.taskId;
	return (
		<div>
			<TaskDetailPage taskId={taskId} />
		</div>
	);
};

export default page;
