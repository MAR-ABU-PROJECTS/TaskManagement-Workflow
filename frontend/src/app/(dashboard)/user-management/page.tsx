import UsersManagement from "@/components/Users";
import { getSessionUser } from "@/lib/action";
import { Can, Permission, Role } from "@/lib/rolespermissions";

export const NotAuthorized = () => {
	return (
		<div className="flex items-center justify-center pt-14">
			<div className="text-center">
				<h1 className="mb-3 text-2xl font-[500]">Not Authorized</h1>
				<p className="text-gray-500">
					you&apos;re not allowed to view this page contact admin
				</p>
			</div>
		</div>
	);
};

const page = async () => {
	const user = await getSessionUser();

	return (
		<Can
			role={user?.user.role as Role}
			Permission={Permission["VIEW_USER"]}
			fallback={<NotAuthorized />}
		>
			<UsersManagement />
		</Can>
	);
};

export default page;
