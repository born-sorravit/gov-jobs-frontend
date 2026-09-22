import "server-only";

import { readTokens } from "@/lib/auth/session";
import { env } from "@/lib/env";
import type { JobAlert } from "@/types/api";

/**
 * Server-side read of one alert.
 *
 * The browser-facing client goes through `/api/backend`, which only exists for requests the
 * browser makes. A server component already holds the cookie, so it calls the API directly
 * with the bearer token and saves a hop.
 */
export async function getServerJobAlert(id: string): Promise<JobAlert | null> {
	const { accessToken } = await readTokens();
	if (!accessToken) return null;

	const response = await fetch(`${env.apiBaseUrl}/job-alerts/${id}`, {
		headers: { Authorization: `Bearer ${accessToken}` },
		cache: "no-store",
	});

	if (!response.ok) return null;

	const payload = (await response.json()) as { data: JobAlert };
	return payload.data;
}
