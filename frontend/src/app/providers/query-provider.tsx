"use client";
import {
	QueryClient,
	MutationCache,
	QueryCache,
	QueryClientProvider,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState } from "react";
import { toast } from "sonner";

export default function QueryProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	type success = {
		success: boolean;
		data?: unknown;
		message?: string;
	};

	function isSuccessResponse(data: unknown): data is success {
		return typeof data === "object" && data !== null && "success" in data;
	}
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// Needed so "context" works in cache callbacks
						meta: {},
					},
					mutations: {
						meta: {},
					},
				},
				queryCache: new QueryCache({
					onSuccess: (data, query) => {
						if (query.meta?.disableGlobalSuccess) return;
						let message = "Operation successful";
						if (isSuccessResponse(data)) {
							message = data.message ?? message;
						}
						toast.success(message);
					},
					onError: (error, query) => {
						if (query.meta?.disableGlobalError) return;
						let message = "Something went wrong";
						if (isAxiosError(error)) {
							message = error.response?.data?.message;
						} else {
							message = error?.message || message;
						}
						toast.error(message);
					},
				}),
				mutationCache: new MutationCache({
					onSuccess: (data, _variables, _context, mutation) => {
						if (mutation.options.meta?.disableGlobalSuccess) return;
						let message = "Operation successful";
						if (isSuccessResponse(data)) {
							message = data.message ?? message;
						}
						toast.success(message);
					},
					onError: (error, _variables, _context, mutation) => {
						if (mutation.meta?.disableGlobalError) return;
						let message = "Something went wrong";
						if (isAxiosError(error)) {
							message = error.response?.data?.message;
						} else {
							message = error?.message || message;
						}
						toast.error(message);
					},
				}),
			})
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}
