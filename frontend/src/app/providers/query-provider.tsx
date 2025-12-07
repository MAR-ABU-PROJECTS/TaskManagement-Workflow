"use client";
import {
  QueryClient,
  MutationCache,
  QueryCache,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            toast.error("Error", {
              description: error.message,
            });
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            toast.error("Error", {
              description: error.message,
            });
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
