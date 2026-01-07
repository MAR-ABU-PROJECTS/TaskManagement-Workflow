export enum Role {
	SUPER_ADMIN = "SUPER_ADMIN",
	CEO = "CEO",
	HR = "HR",
	HOO = "HOO",
	ADMIN = "ADMIN",
	STAFF = "STAFF",
}

export const PromotionRules: Record<Role, Role[]> = {
	[Role.SUPER_ADMIN]: [Role.CEO, Role.HR, Role.HOO, Role.ADMIN, Role.STAFF],
	[Role.CEO]: [Role.HR, Role.HOO, Role.ADMIN, Role.STAFF],
	[Role.HR]: [Role.ADMIN, Role.STAFF],
	[Role.HOO]: [Role.ADMIN, Role.STAFF],
	[Role.ADMIN]: [Role.STAFF],
	[Role.STAFF]: [],
};

// export const CanBePromotedBy = {
// 	[Role.SUPER_ADMIN]: [],
// 	[Role.CEO]: [Role.SUPER_ADMIN],
// 	[Role.HR]: [Role.CEO],
// 	[Role.HOO]: [Role.CEO],
// 	[Role.ADMIN]: [Role.HR, Role.HOO, Role.CEO],
// 	[Role.STAFF]: [Role.ADMIN, Role.HR, Role.HOO, Role.CEO, Role.SUPER_ADMIN],
// } as const;

export function canPromote(currentUserRole: Role, targetRole: Role) {
	return PromotionRules[currentUserRole]?.includes(targetRole);
}

export enum Permission {
	CREATE_USER = "CREATE_USER",
	UPDATE_USER = "UPDATE_USER",
	DELETE_USER = "DELETE_USER",
	VIEW_USER = "VIEW_USER",

	CREATE_PROJECT = "CREATE_PROJECT",
	UPDATE_PROJECT = "UPDATE_PROJECT",
	DELETE_PROJECT = "DELETE_PROJECT",
	VIEW_PROJECT = "VIEW_PROJECT",

	MANAGE_ROLES = "MANAGE_ROLES",
}

export const RolePermissions: Record<Role, Permission[]> = {
	[Role.STAFF]: [Permission.VIEW_PROJECT],

	[Role.ADMIN]: [
		Permission.CREATE_PROJECT,
		Permission.UPDATE_PROJECT,
		Permission.VIEW_PROJECT,
		Permission.VIEW_USER,
	],

	[Role.HR]: [
		Permission.CREATE_USER,
		Permission.UPDATE_USER,
		Permission.MANAGE_ROLES, // HR can promote to ADMIN
	],

	[Role.HOO]: [
		Permission.UPDATE_PROJECT,
		Permission.VIEW_PROJECT,
		Permission.MANAGE_ROLES, // HOO can promote to ADMIN
	],

	[Role.CEO]: [
		Permission.MANAGE_ROLES,
		Permission.CREATE_PROJECT,
		Permission.UPDATE_PROJECT,
		Permission.DELETE_PROJECT,
		Permission.CREATE_USER,
		Permission.UPDATE_USER,
		Permission.DELETE_USER,
		Permission.VIEW_USER,
	],

	[Role.SUPER_ADMIN]: [
		Permission.MANAGE_ROLES,
		Permission.CREATE_PROJECT,
		Permission.UPDATE_PROJECT,
		Permission.DELETE_PROJECT,
		Permission.CREATE_USER,
		Permission.UPDATE_USER,
		Permission.DELETE_USER,
		// system-level: gets everything
	],
};

const RoleHierarchy = [
	Role.STAFF,
	Role.ADMIN,
	Role.HR,
	Role.HOO,
	Role.CEO,
	Role.SUPER_ADMIN,
] as const;

export function getPermissionsForRole(role: Role): Permission[] {
	const index = RoleHierarchy.indexOf(role);

	const inheritedRoles = RoleHierarchy.slice(0, index + 1);

	const merged = inheritedRoles.flatMap((r) => RolePermissions[r]);

	return Array.from(new Set(merged));
}

export function hasPermission(userRole: Role, permission: Permission) {
	return getPermissionsForRole(userRole).includes(permission);
}

export const Can = ({
	children,
	role,
	Permission,
	fallback,
}: {
	children: React.ReactNode;
	role: Role;
	Permission: Permission;
	fallback?: JSX.Element;
}) => {
	const isAllowed = role ? hasPermission(role, Permission) : false;

	if (!isAllowed) {
		return fallback ?? null;
	}

	return children;
};
