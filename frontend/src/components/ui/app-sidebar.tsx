"use client";
import Link from "next/link";
import {
	Home,
	Users,
	FolderKanban,
	CheckSquare,
	AlertCircle,
	BarChart3,
	Settings,
	UsersRound,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarHeader,
	SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import logo from "@/assets/black-logo.png";
import { useSession } from "@/app/providers/session-provider";
import { getInitials } from "@/lib/utils";
import { useMemo } from "react";
import { hasPermission, Permission, Role } from "@/lib/rolespermissions";

export function AppSidebar() {
	const { user } = useSession();
	const name = user?.name ?? "";
	const { first, last } = getInitials(name);

	const NAV_ITEMS = useMemo(
		() => [
			{ name: "Dashboard", href: "/dashboard", icon: Home },
			{ name: "Projects", href: "/projects", icon: FolderKanban },
			{ name: "Teams", href: "/teams", icon: Users },
			{ name: "Tasks", href: "/tasks", icon: CheckSquare },
			{ name: "Issues", href: "/issues", icon: AlertCircle },
			{ name: "Reports", href: "/reports", icon: BarChart3 },
			{
				name: "User Management",
				href: "/user-management",
				icon: UsersRound,
				permission: Permission.VIEW_USER,
			},
		],
		[]
	);

	const navLinks = useMemo(() => {
		return NAV_ITEMS.filter((item) => {
			// No permission required → visible
			if (!item.permission) return true;

			return hasPermission(user?.role as Role, item.permission);
		});
	}, [user?.role, NAV_ITEMS]);
	return (
		<Sidebar>
			<SidebarHeader className="border-b border-sidebar-border p-4">
				<Link href="/dashboard" className="flex items-center gap-2">
					<Image
						src={logo}
						alt="marabu logo"
						className="object-contain h-[50px]"
					/>
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navLinks.map((item) => (
								<SidebarMenuItem key={item.name}>
									<SidebarMenuButton asChild>
										<Link
											href={item.href}
											className="text-base"
										>
											<item.icon className="h-4 w-4" />
											<span>{item.name}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="border-t border-sidebar-border p-4">
				<div className="flex items-center gap-3">
					<Avatar className="h-8 w-8">
						<AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground uppercase text-sm">
							{first} {last}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 overflow-hidden">
						<p className="truncate text-sm font-medium">
							{user?.name ?? ""}
						</p>
						<p className="truncate text-xs text-sidebar-foreground/60">
							{user?.email ?? ""}
						</p>
					</div>
					<Link href="/settings">
						<Settings className="h-4 w-4 text-sidebar-foreground/60 hover:text-sidebar-foreground" />
					</Link>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
