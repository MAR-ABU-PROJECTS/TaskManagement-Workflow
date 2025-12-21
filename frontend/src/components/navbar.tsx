"use client";
import React from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Bell, LogOut } from "lucide-react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	// BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const Navbar = () => {
	return (
		<header className="flex h-[80px] shrink-0 items-center gap-2 border-b border-border px-4 sticky top-0  z-10 bg-background/80 w-full">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mr-2 h-4" />
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem className="hidden md:block">
						{/* <BreadcrumbLink href="#">Dashboard</BreadcrumbLink> */}
						<BreadcrumbPage className="text-[18px] font-medium">
							Dashboard
						</BreadcrumbPage>
					</BreadcrumbItem>
					{/* <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Data Fetching</BreadcrumbPage>
          </BreadcrumbItem> */}
				</BreadcrumbList>
			</Breadcrumb>
			<div className="ml-auto flex items-center gap-2">
				<Button
					variant="outline"
					size="icon"
					aria-label="Notifications"
					title="notifications"
				>
					<Bell />
				</Button>
				<Button
					variant="outline"
					size="icon"
					aria-label="Log Out"
					title="Log out"
				>
					<LogOut />
				</Button>
			</div>
		</header>
	);
};

export default Navbar;
