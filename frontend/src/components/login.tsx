"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import logo from "../assets/black-logo.png";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/app/(auth)/service";
import { setSession } from "@/lib/action";
import Routes from "@/constants/routes";

export default function LoginPage() {
	const router = useRouter();
	type LoginType = z.infer<typeof loginSchema>;
	const form = useForm<LoginType>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const login = useMutation({
		mutationFn: (data: LoginType) => authService.login(data),
		onSuccess: async (res) => {
			await setSession({
				email: res.user.email,
				id: res.user.id,
				name: res.user.name,
				token: res.token,
				refreshToken: "",
				role: res.user.role,
			});

			router.push(Routes.dashboard);
		},
	});

	const onSubmit = (data: LoginType) => {
		login.mutate(data);
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<div className="mb-4 flex justify-center">
						<Image
							src={logo}
							alt="marabu logo"
							className="object-contain h-[50px]"
						/>
					</div>
					<CardTitle className="text-center text-2xl">
						Welcome back
					</CardTitle>
					<CardDescription className="text-center text-base">
						Sign in to your MAR PM account
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-4"
						>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												type="email"
												className="h-[40px]"
												placeholder="name@company.com"
												{...field}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input
												id="password"
												type="password"
												className="h-[40px]"
												{...field}
											/>
										</FormControl>
										<FormMessage />
										<div className="space-y-2">
											<div className="flex items-center justify-end">
												<Link
													href="/forgot-password"
													className="text-sm text-primary hover:underline"
												>
													Forgot password?
												</Link>
											</div>
										</div>
									</FormItem>
								)}
							/>

							<Button
								type="submit"
								className="w-full"
								disabled={login.isPending}
								isLoading={login.isPending}
							>
								Sign In
							</Button>
						</form>
					</Form>
				</CardContent>
				<CardFooter className="flex flex-col space-y-4">
					<div className="text-center text-sm text-muted-foreground">
						{"Don't have an account? "}
						<Link
							href="/sign-up"
							className="text-primary hover:underline"
						>
							Sign up
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}

export const loginSchema = z.object({
	email: z.email().min(1),
	password: z.string().min(8, "must be at least eight characters"),
});
