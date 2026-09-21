"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode, useState } from "react";

/**
 * The client is created inside state, not at module scope: on the server a module-level
 * client would be shared across requests and leak one user's data into another's cache.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// Announcements change at crawl cadence, not per second.
						staleTime: 60_000,
						gcTime: 5 * 60_000,
						retry: 1,
						refetchOnWindowFocus: false,
					},
				},
			})
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{process.env.NODE_ENV === "development" ? <ReactQueryDevtools initialIsOpen={false} /> : null}
		</QueryClientProvider>
	);
}
