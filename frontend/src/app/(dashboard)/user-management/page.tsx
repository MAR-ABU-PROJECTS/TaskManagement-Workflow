import NotAuthorized from "@/components/NotAuthorized";
import UsersManagement from "@/components/Users";
import { getSessionUser } from "@/lib/action";
import { Can, Permission, Role } from "@/lib/rolespermissions";

const page = async () => {
	const user = await getSessionUser();

	return (
		<div>
			<Can
				role={user?.user.role as Role}
				Permission={Permission["VIEW_USER"]}
				fallback={<NotAuthorized />}
			>
				<UsersManagement />
			</Can>
		</div>
	);
};

export default page;
