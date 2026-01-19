import EditTaskPage from "@/components/EditTaksPage";
import React from "react";

type Props = {
	params: { id: string };
};
const page = ({ params }: Props) => {
	const { id } = params;
	return <EditTaskPage id={id} />;
};

export default page;
