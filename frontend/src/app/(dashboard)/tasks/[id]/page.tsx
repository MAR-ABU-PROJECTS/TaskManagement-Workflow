import TaskDetailPage from "@/components/TaskDetailPage";
import React from "react";

type Props = {
	params: { id: string };
};
const page = ({params}: Props) => {
  const id = params.id
	return <TaskDetailPage taskId={id} />;
};

export default page;
