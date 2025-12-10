"use client";

import { SessionData } from "@/lib/session";
import { createContext, useContext, useState } from "react";

const SessionContext = createContext<SessionData | null>(null);

export function SessionProvider({
	children,
	initialUser,
}: {
	children: React.ReactNode;
	initialUser: SessionData | null;
}) {
	const [user] = useState(initialUser);

	return (
		<SessionContext.Provider value={{user: user }}>
			{children}
		</SessionContext.Provider>
	);
}

export function useSession() {
	const ctx = useContext(SessionContext);
	if (!ctx) throw new Error("useSession must be used inside SessionProvider");
	return ctx;
}
