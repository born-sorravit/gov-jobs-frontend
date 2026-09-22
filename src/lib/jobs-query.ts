import type { JobStatus, JobsQuery } from "@/types/api";

export const JOB_SORT_KEYS = [
	"publishedAt",
	"applicationEnd",
	"applicationStart",
	"salaryMax",
	"salaryMin",
	"title",
	"firstSeenAt",
] as const;

export const JOB_STATUSES: JobStatus[] = ["OPEN", "UPCOMING", "CLOSED"];

/**
 * The salary filter is always one of these, never a free range — the UI offers a fixed set of
 * bands. Both the search bar that sets one and the chip row that displays it read this list,
 * so a chip can name the band the reader actually picked instead of reconstructing a range
 * from its bounds (which printed "––15,000" for the open-ended first band).
 */
export const SALARY_BANDS = [
	{ id: 1, min: undefined, max: 15_000 },
	{ id: 2, min: 15_000, max: 25_000 },
	{ id: 3, min: 25_000, max: 40_000 },
	{ id: 4, min: 40_000, max: undefined },
] as const;

export type SalaryBandId = (typeof SALARY_BANDS)[number]["id"];

/** The band matching an exact min/max pair, or undefined if the query carries something else. */
export const findSalaryBand = (min: number | undefined, max: number | undefined) =>
	SALARY_BANDS.find((band) => band.min === min && band.max === max);

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;

/**
 * Whatever a page receives for its query string.
 *
 * A server component gets `Record<string, string | string[]>`; the browser gets
 * `URLSearchParams`. Both shapes go through the same parser so the two never disagree —
 * a second parser would mean a hydration mismatch or a pointless refetch on mount.
 */
export type RawSearchParams = URLSearchParams | Record<string, string | string[] | undefined>;

const readAll = (params: RawSearchParams, key: string): string[] => {
	if (params instanceof URLSearchParams) return params.getAll(key);
	const value = params[key];
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
};

const readOne = (params: RawSearchParams, key: string): string | undefined =>
	readAll(params, key)[0];

/** Accepts both repeated keys and comma-separated values, exactly as the API does. */
const readNumbers = (params: RawSearchParams, key: string): number[] | undefined => {
	const parsed = readAll(params, key)
		.flatMap((entry) => entry.split(","))
		.map((entry) => Number.parseInt(entry.trim(), 10))
		.filter((entry) => Number.isFinite(entry));

	return parsed.length > 0 ? [...new Set(parsed)] : undefined;
};

const readNumber = (params: RawSearchParams, key: string): number | undefined => {
	const raw = readOne(params, key);
	if (raw === undefined || raw.trim() === "") return undefined;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
};

/** The one place a URL becomes a query. Used by the server page and by the client hook. */
export const parseJobsSearchParams = (params: RawSearchParams): JobsQuery => {
	const q = readOne(params, "q")?.trim();
	const status = readOne(params, "status");
	const sortBy = readOne(params, "sortBy");
	const page = readNumber(params, "page");
	const limit = readNumber(params, "limit");
	const order = readOne(params, "order");

	return {
		q: q === "" ? undefined : q,
		province: readNumbers(params, "province"),
		jobType: readNumbers(params, "jobType"),
		jobCategory: readNumbers(params, "jobCategory"),
		education: readNumbers(params, "education"),
		provinceStrict: readOne(params, "provinceStrict") === "true" || undefined,
		status: JOB_STATUSES.includes(status as JobStatus) ? (status as JobStatus) : undefined,
		salaryMin: readNumber(params, "salaryMin"),
		salaryMax: readNumber(params, "salaryMax"),
		page: page && page > 0 ? page : 1,
		limit: limit ? Math.min(Math.max(limit, 1), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE,
		sortBy: (JOB_SORT_KEYS as readonly string[]).includes(sortBy ?? "")
			? (sortBy as JobsQuery["sortBy"])
			: undefined,
		order: order === "ASC" || order === "DESC" ? order : undefined,
	};
};

/**
 * The inverse: a query back into a URL query string.
 *
 * Defaults are omitted so a pristine `/jobs` stays a clean URL, and the result is a stable
 * serialisation of the same state — which is what the TanStack Query key is built from.
 */
export const buildJobsSearchParams = (query: JobsQuery): URLSearchParams => {
	const params = new URLSearchParams();

	if (query.q) params.set("q", query.q);
	for (const key of ["province", "jobType", "jobCategory", "education"] as const) {
		for (const id of query[key] ?? []) params.append(key, String(id));
	}
	if (query.provinceStrict) params.set("provinceStrict", "true");
	if (query.status) params.set("status", query.status);
	if (query.salaryMin !== undefined) params.set("salaryMin", String(query.salaryMin));
	if (query.salaryMax !== undefined) params.set("salaryMax", String(query.salaryMax));
	if (query.page && query.page > 1) params.set("page", String(query.page));
	if (query.limit && query.limit !== DEFAULT_PAGE_SIZE) params.set("limit", String(query.limit));
	if (query.sortBy) params.set("sortBy", query.sortBy);
	if (query.order) params.set("order", query.order);

	params.sort(); // stable ordering, so the same filters always produce the same key
	return params;
};

/** Canonical string form of a query — the TanStack Query key for a jobs page. */
export const jobsQueryKey = (query: JobsQuery): [string, string] => [
	"jobs",
	buildJobsSearchParams(query).toString(),
];

/** True when no filter is applied, so the empty state can say the right thing. */
export const hasActiveFilters = (query: JobsQuery): boolean =>
	Boolean(
		query.q ||
			query.province?.length ||
			query.jobType?.length ||
			query.jobCategory?.length ||
			query.education?.length ||
			query.status ||
			query.salaryMin !== undefined ||
			query.salaryMax !== undefined
	);
