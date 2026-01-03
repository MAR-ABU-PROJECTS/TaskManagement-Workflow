import EditProjectPage from "@/components/EditProjects";
import React from "react";

type PageProps = {
	params: {
		id: string;
	};
};
const page = ({ params }: PageProps) => {
	const { id } = params;
	return <EditProjectPage id={id} />;
};

export default page;
