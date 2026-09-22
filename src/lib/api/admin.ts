import type { Paginated } from "@/types/api";

const PROXY = "/api/backend";

export interface CrawlerRun {
	id: string;
	source: string;
	status: "RUNNING" | "SUCCESS" | "FAILED";
	trigger: string;
	startedAt: string;
	finishedAt: string | null;
	durationSeconds: number | null;
	totalFound: number;
	newJobs: number;
	updatedJobs: number;
	unchangedJobs: number;
	skippedJobs: number;
	alertMatches: number;
	errorMessage: string | null;
}

export interface AdminOverview {
	users: number;
	admins: number;
	jobs: number;
	openJobs: number;
	savedJobs: number;
	alerts: number;
	activeAlerts: number;
	alertMatches: number;
	pendingNotifications: number;
	emailsSent: number;
	emailsFailed: number;
	lastCrawlerRun: CrawlerRun | null;
	consecutiveFailures: number;
}

export interface AdminUser {
	id: string;
	email: string;
	name: string;
	role: string;
	isVerified: boolean;
	createdAt: string;
	alertCount: number;
	savedJobCount: number;
}

export interface AdminEmailLog {
	id: string;
	toEmail: string;
	subject: string;
	template: string;
	status: "QUEUED" | "SENT" | "FAILED";
	provider: string;
	sentAt: string | null;
	errorMessage: string | null;
	createdAt: string;
}

export interface AdminAlert {
	id: string;
	name: string;
	ownerEmail: string;
	frequency: string;
	isActive: boolean;
	keywordCount: number;
	matchCount: number;
	lastSentAt: string | null;
	createdAt: string;
}

const unwrap = async <T>(response: Response): Promise<T> => {
	const payload = (await response.json().catch(() => null)) as
		| { data?: T; message?: string }
		| null;
	if (!response.ok) throw new Error(payload?.message ?? response.statusText);
	return payload?.data as T;
};

const page = async <T>(path: string, signal?: AbortSignal): Promise<Paginated<T>> => {
	const response = await fetch(`${PROXY}${path}`, { signal });
	const payload = (await response.json().catch(() => null)) as {
		data?: T[];
		meta?: Paginated<T>["meta"];
		message?: string;
	} | null;
	if (!response.ok) throw new Error(payload?.message ?? response.statusText);
	return {
		data: payload?.data ?? [],
		meta: payload?.meta ?? { total: 0, page: 1, last_page: 0, limit: 20 },
	};
};

export const fetchOverview = async (signal?: AbortSignal): Promise<AdminOverview> =>
	unwrap<AdminOverview>(await fetch(`${PROXY}/admin/overview`, { signal }));

export const fetchCrawlerRuns = (signal?: AbortSignal) =>
	page<CrawlerRun>("/admin/crawler-runs?limit=10", signal);

export const fetchAdminUsers = (signal?: AbortSignal) =>
	page<AdminUser>("/admin/users?limit=10", signal);

export const fetchAdminAlerts = (signal?: AbortSignal) =>
	page<AdminAlert>("/admin/alerts?limit=10", signal);

export const fetchAdminEmailLogs = (signal?: AbortSignal) =>
	page<AdminEmailLog>("/admin/email-logs?limit=10", signal);
