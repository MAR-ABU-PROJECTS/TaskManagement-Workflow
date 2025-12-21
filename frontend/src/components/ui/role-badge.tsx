"use client";

import { Badge } from "@/components/ui/badge";
import { Role } from "@/lib/rolespermissions";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
	role: Role;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => {
	const getBadgeVariants = () => {
		if (!role) return "";
		switch (role) {
			case Role.SUPER_ADMIN:
				return "bg-red-100 text-red-800";
			case Role.CEO:
				return "bg-orange-100 text-orange-800";
			case Role.HR:
				return "bg-yellow-100 text-yellow-800";
			case Role.HOO:
				return "bg-green-100 text-green-800";
			case Role.ADMIN:
				return "bg-blue-100 text-blue-800";
			case Role.STAFF:
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<Badge className={cn(`${getBadgeVariants}, hover:bg-none`)}>
			{role && role.replace("_", " ")}
		</Badge>
	);
};
