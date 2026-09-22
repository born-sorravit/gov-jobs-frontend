import type { AlertFrequency, JobAlert, Paginated } from "@/types/api";

const PROXY = "/api/backend";

export interface JobAlertInput {
	name: string;
	keywords: string[];
	jobTypes: number[];
	educations: number[];
	provinces: number[];
	notificationEmail?: string;
	frequency: AlertFrequency;
}

const unwrap = async <T>(response: Response): Promise<T> => {
	const payload = (await response.json().catch(() => null)) as
		| { data?: T; message?: string }
		| null;
	if (!response.ok) throw new Error(payload?.message ?? response.statusText);
	return payload?.data as T;
};

export const fetchJobAlerts = async (signal?: AbortSignal): Promise<Paginated<JobAlert>> => {
	const response = await fetch(`${PROXY}/job-alerts?limit=50`, { signal });
	const payload = (await response.json().catch(() => null)) as {
		data?: JobAlert[];
		meta?: Paginated<JobAlert>["meta"];
		message?: string;
	} | null;
	if (!response.ok) throw new Error(payload?.message ?? response.statusText);
	return {
		data: payload?.data ?? [],
		meta: payload?.meta ?? { total: 0, page: 1, last_page: 0, limit: 50 },
	};
};

export const fetchJobAlert = async (id: string, signal?: AbortSignal): Promise<JobAlert> =>
	unwrap<JobAlert>(await fetch(`${PROXY}/job-alerts/${id}`, { signal }));

const json = (method: string, body?: unknown): RequestInit => ({
	method,
	headers: body === undefined ? undefined : { "Content-Type": "application/json" },
	body: body === undefined ? undefined : JSON.stringify(body),
});

export const createJobAlert = async (input: JobAlertInput): Promise<JobAlert> =>
	unwrap<JobAlert>(await fetch(`${PROXY}/job-alerts`, json("POST", input)));

export const updateJobAlert = async (
	id: string,
	input: Partial<JobAlertInput>
): Promise<JobAlert> => unwrap<JobAlert>(await fetch(`${PROXY}/job-alerts/${id}`, json("PATCH", input)));

export const deleteJobAlert = async (id: string): Promise<void> => {
	unwrap(await fetch(`${PROXY}/job-alerts/${id}`, json("DELETE")));
};

/** Pause and resume are separate endpoints rather than a PATCH, because resuming also
 *  moves the alert's matching floor — it is a state transition, not a field edit. */
export const setJobAlertActive = async (id: string, active: boolean): Promise<JobAlert> =>
	unwrap<JobAlert>(
		await fetch(`${PROXY}/job-alerts/${id}/${active ? "resume" : "pause"}`, json("POST"))
	);
