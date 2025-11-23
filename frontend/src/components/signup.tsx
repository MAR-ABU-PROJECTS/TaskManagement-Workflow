"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function SignUpPage() {
	const router = useRouter();

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
						Sign up
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							className="h-[40px]"
							placeholder="name@company.com"
						/>
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="password">Password</Label>
							<Link
								href="/forgot-password"
								className="text-sm text-primary hover:underline"
							>
								Forgot password?
							</Link>
						</div>
						<Input
							id="password"
							type="password"
							className="h-[40px]"
						/>
					</div>
					<Button
						className="w-full"
						onClick={() => router.push("/dashboard")}
					>
						Sign In
					</Button>
				</CardContent>
				<CardFooter className="flex flex-col space-y-4">
					<div className="text-center text-sm text-muted-foreground">
						{"Already have an account? "}
						<Link href="/" className="text-primary hover:underline">
							Sign In
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
