import React from "react";
import UserDetails from "./component/UserDetails";
import { Can, Permission, Role } from "@/lib/rolespermissions";

import { getSessionUser } from "@/lib/action";
import NotAuthorized from "@/components/NotAuthorized";

type Props = {
	params: {
		userId: string;
	};
};
const page = async ({ params }: Props) => {
	const user = await getSessionUser();
	const userId = params.userId;
	return (
		<div>
			<Can
				role={user?.user.role as Role}
				Permission={Permission["VIEW_USER"]}
				fallback={<NotAuthorized />}
			>
				<UserDetails userId={userId} />
			</Can>
		</div>
	);
};

export default page;
