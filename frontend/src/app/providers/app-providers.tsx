"use client";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import QueryProvider from "./query-provider";
// import ReduxProvider from "./reduxprovider";
// import ReactQueryClientProvider from "./QueryClientProvider";
// import AuthWrapper from "@providers/authWrapper";
// import { ToastContainer } from "react-toastify";

type Props = {
  children: ReactNode;
};

export default function AppProviders({ children }: Props) {
  return (
    <QueryProvider>
      {/* <ReduxProvider> */}
      <Toaster richColors position="top-center" />
      {children}
      {/* </ReduxProvider> */}
    </QueryProvider>
  );
}
