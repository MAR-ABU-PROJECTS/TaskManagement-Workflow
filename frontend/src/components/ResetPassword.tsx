"use client";
import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";
import Image from "next/image";
import logo from "@/assets/black-logo.png";
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
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/app/(auth)/service";
import Link from "next/link";

const ResetPassword = ({
	email,
	token,
}: {
	email: string | null;
	token: string | null;
}) => {
	type registerType = z.infer<typeof authSchema>;
	const form = useForm<registerType>({
		resolver: zodResolver(authSchema),
		defaultValues: {
			email: email ?? "",
			password: "",
			confirmPassword: "",
		},
	});
	const mutation = useMutation({
		mutationFn: (data: registerType) =>
			authService.resetPassword({
				token: token ?? "",
				newPassword: data.password,
			}),
	});

	const onSubmit = (data: registerType) => {
		mutation.mutate(data);
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
						Welcome
					</CardTitle>
					<CardDescription className="text-center text-base">
						Reset Password
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Form {...form}>
						<form
							className="space-y-4"
							onSubmit={form.handleSubmit(onSubmit)}
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
												placeholder="New Password"
												id="password"
												type="password"
												className="h-[40px]"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm Password</FormLabel>
										<FormControl>
											<Input
												placeholder="Re-enter New Password"
												id="password"
												type="password"
												className="h-[40px]"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div></div>
							<Button
								type="submit"
								isLoading={mutation.isPending}
								disabled={mutation.isPending}
								className="w-full mt-2!"
								// onClick={() => router.push("/dashboard")}
							>
								Reset Password
							</Button>
						</form>
					</Form>
				</CardContent>
				<CardFooter className="flex flex-col space-y-4">
					<div className="text-center text-sm text-muted-foreground">
						{"Already have an account? "}
						<Link
							href="/log-in"
							className="text-primary hover:underline"
						>
							Log In
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
};

export default ResetPassword;

export const authSchema = z
	.object({
		email: z.email().min(1, "email is required"),
		password: z.string().min(8, "must be at least eight characters"),
		confirmPassword: z.string().min(8, "must be at least eight characters"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "passwords do not match",
		path: ["confirmPassword"],
	});
