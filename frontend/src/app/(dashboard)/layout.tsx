import type React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import Navbar from "@/components/navbar";
import { getSessionUser } from "@/lib/action";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSessionUser();
	if (!session?.user) {
		redirect("/");
	}
	
	return (
		<SidebarProvider>
			<AppSidebar />
			<div className="flex flex-col flex-1 w-full h-full">
				<Navbar />
				<div className="overflow-x-hidden w-full">{children}</div>
			</div>
		</SidebarProvider>
	);
}
