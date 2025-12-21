import ProjectBoaard from "@/components/project-detail";
import React from "react";

type Props = {
	params: { id: string };
};
const page = ({ params }: Props) => {
	const projectId = params.id;
	return (
		<div className="w-full h-full overflow-x-hidden">
			<ProjectBoaard projectId={projectId} />
		</div>
	);
};

export default page;
