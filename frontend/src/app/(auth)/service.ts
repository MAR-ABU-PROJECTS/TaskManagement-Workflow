import { authSchema } from "@/components/signup";
import { apiService } from "@/lib/apiService";
import z from "zod";

type AuthBody = z.infer<typeof authSchema>;

export const authService = {
	register: (data: AuthBody) => apiService.post("/api/auth/register", data),
	login: (data: Pick<AuthBody, "email" | "password">) =>
		apiService.post("/api/auth/login", data),
};
