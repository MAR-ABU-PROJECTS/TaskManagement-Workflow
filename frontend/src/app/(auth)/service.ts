import { authSchema } from "@/components/signup";
import { apiService } from "@/lib/apiService";
import z from "zod";

type AuthBody = z.infer<typeof authSchema>;

export const authService = {
	register: (data: AuthBody) => apiService.post("/auth/register", data),
	requestReset: (email: string) =>
		apiService.post("/auth/forgot-password", { email: email }),
	resetPassword: ({
		token,
		newPassword,
	}: {
		token: string;
		newPassword: string;
	}) => apiService.post("/auth/reset-password", { token, newPassword }),
	login: (data: Pick<AuthBody, "email" | "password">) =>
		apiService.post("/auth/login", data),
	logOut: () => apiService.post("/auth/logout", {}),
};
