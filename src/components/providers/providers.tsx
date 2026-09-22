"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";
import type { AuthUser } from "@/types/api";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function Providers({
	children,
	initialUser,
}: {
	children: ReactNode;
	initialUser: AuthUser | null;
}) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
			<QueryProvider>
				<SessionProvider initialUser={initialUser}>
					{children}
					<Toaster richColors position="top-right" />
				</SessionProvider>
			</QueryProvider>
		</ThemeProvider>
	);
}
