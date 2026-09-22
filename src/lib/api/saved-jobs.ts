import type { JobSummary, Paginated } from "@/types/api";

/**
 * Saved jobs go through the Next proxy, not straight to the API.
 *
 * These calls need the bearer token, which lives in an httpOnly cookie the browser cannot
 * read — so the request is made to our own origin and the proxy attaches it server-side.
 */
const PROXY = "/api/backend";

export interface SavedJob extends JobSummary {
	savedAt: string;
}

const unwrap = async <T>(response: Response): Promise<T> => {
	const payload = (await response.json().catch(() => null)) as
		| { data?: T; message?: string }
		| null;

	if (!response.ok) {
		throw new Error(payload?.message ?? response.statusText);
	}

	return payload?.data as T;
};

export const fetchSavedJobIds = async (signal?: AbortSignal): Promise<string[]> =>
	unwrap<string[]>(await fetch(`${PROXY}/saved-jobs/ids`, { signal }));

export const fetchSavedJobs = async (
	page = 1,
	limit = 12,
	signal?: AbortSignal
): Promise<Paginated<SavedJob>> => {
	const response = await fetch(`${PROXY}/saved-jobs?page=${page}&limit=${limit}`, { signal });
	const payload = (await response.json().catch(() => null)) as {
		data?: SavedJob[];
		meta?: Paginated<SavedJob>["meta"];
		message?: string;
	} | null;

	if (!response.ok) throw new Error(payload?.message ?? response.statusText);

	return {
		data: payload?.data ?? [],
		meta: payload?.meta ?? { total: 0, page: 1, last_page: 0, limit },
	};
};

export const saveJob = async (jobId: string): Promise<void> => {
	unwrap(await fetch(`${PROXY}/saved-jobs/${jobId}`, { method: "POST" }));
};

export const unsaveJob = async (jobId: string): Promise<void> => {
	unwrap(await fetch(`${PROXY}/saved-jobs/${jobId}`, { method: "DELETE" }));
};
