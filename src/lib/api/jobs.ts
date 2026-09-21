import { apiFetch, apiFetchPaginated } from "@/lib/api-client";
import type { JobDetail, JobSummary, JobsQuery, Paginated, ReferenceCatalog } from "@/types/api";

/**
 * `JobsQuery` maps onto the API's parameters one-to-one, so it is passed through as the
 * query object rather than re-derived — `apiFetch` repeats array keys the way
 * class-validator expects.
 */
export const fetchJobs = (query: JobsQuery, signal?: AbortSignal): Promise<Paginated<JobSummary>> =>
	apiFetchPaginated<JobSummary>("/jobs", {
		query: {
			q: query.q,
			province: query.province,
			jobType: query.jobType,
			jobCategory: query.jobCategory,
			education: query.education,
			provinceStrict: query.provinceStrict,
			status: query.status,
			salaryMin: query.salaryMin,
			salaryMax: query.salaryMax,
			page: query.page,
			limit: query.limit,
			sortBy: query.sortBy,
			order: query.order,
		},
		signal,
	});

export const fetchJob = (id: string, signal?: AbortSignal): Promise<JobDetail> =>
	apiFetch<JobDetail>(`/jobs/${id}`, { signal });

export const fetchReference = (signal?: AbortSignal): Promise<ReferenceCatalog> =>
	apiFetch<ReferenceCatalog>("/reference", { signal });
