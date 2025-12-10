import DashboardPage from "@/components/Dashboard";
import React from "react";
import { getSessionUser } from "@/lib/action";

const page = async () => {
	const user = await getSessionUser();
	console.log({ user });
	return <DashboardPage />;
};

export default page;
