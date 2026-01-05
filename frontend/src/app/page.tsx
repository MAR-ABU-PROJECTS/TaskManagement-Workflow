import LoginPage from "@/components/login";
import { getSessionUser } from "@/lib/action";
import { redirect } from "next/navigation";

export default async function Home() {
	const session = await getSessionUser();
	if (session?.user.isLoggedIn) {
		redirect("/dashboard");
	}
	return <LoginPage />;
}
