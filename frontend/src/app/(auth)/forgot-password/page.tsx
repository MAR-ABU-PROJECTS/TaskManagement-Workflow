"use client";
import ForgotPassword from "@/components/ForgotPassword";
import ResetPassword from "@/components/ResetPassword";
import suspense from "@/lib/suspense";
import { useSearchParams } from "next/navigation";

const ForgotPasswordPage = () => {
	const params = useSearchParams();
	const intent = params.get("intent");
	const email = params.get("email");
	const token = params.get("token");

	switch (intent) {
		case "reset_password":
			return <ResetPassword email={email} token={token} />;

		default:
			return <ForgotPassword />;
	}
};

export default suspense(ForgotPasswordPage);
