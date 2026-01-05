// lib/session/session-context.tsx
"use client";

import { createContext, useContext, useState } from "react";
// import { fetchSession } from "./actions";

type SessionUser = {
	id?: string;
	name?: string;
	email?: string;
	role?: string;
	isLoggedIn?: boolean;
};

type SessionContextType = {
	user: SessionUser | null;
	// loading: boolean;
	// refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({
	children,
	initialUser,
}: {
	children: React.ReactNode;
	initialUser?: SessionUser | null;
}) {
	const [user] = useState<SessionUser | null>(
		initialUser ?? null
	);
	// const [loading, setLoading] = useState(!initialUser);

	// const refresh = async () => {
	// 	setLoading(true);
	// 	const session = await fetchSession();
	// 	setUser(session?.user ?? null);
	// 	setLoading(false);
	// };

	// useEffect(() => {
	// 	if (!initialUser) {
	// 		refresh();
	// 	}
	// }, []);

	return (
		<SessionContext.Provider value={{ user }}>
			{children}
		</SessionContext.Provider>
	);
}

export function useSession() {
	const ctx = useContext(SessionContext);
	if (!ctx) {
		throw new Error("useSession must be used within SessionProvider");
	}
	return ctx;
}
