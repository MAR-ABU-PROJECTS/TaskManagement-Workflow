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
} from "@/components/ui/card";
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
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/app/(auth)/service";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
	const router = useRouter();
	type registerType = z.infer<typeof authSchema>;

	const form = useForm<registerType>({
		resolver: zodResolver(authSchema),
		defaultValues: {
			email: "",
		},
	});

	const requestReset = useMutation({
		mutationFn: (data: registerType) =>
			authService.requestReset(data.email),
		onSuccess: (_,variable) => {
			router.push(`?intent=reset_password&email=${variable.email}`);
		},
	});

	const onSubmit = (data: registerType) => {
		requestReset.mutate(data);
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

							<div></div>
							<Button
								type="submit"
								isLoading={requestReset.isPending}
								disabled={requestReset.isPending}
								className="w-full mt-2!"
							>
								Request Password Reset
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
}

export const authSchema = z.object({
	email: z.email().min(1, "email is required"),
});
