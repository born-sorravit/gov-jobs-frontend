"use client";

import { fetchJobs, fetchReference } from "@/lib/api/jobs";
import { jobsQueryKey } from "@/lib/jobs-query";
import type { JobSummary, JobsQuery, Paginated, ReferenceCatalog } from "@/types/api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/**
 * `initialData` is applied **only** to the key the server actually rendered.
 *
 * Seeding it unconditionally would hand every filter change the unfiltered first page while
 * its own request is still in flight, so the user sees the wrong rows for a frame before
 * they are replaced. `initialKey` is the serialised query the server fetched; anything else
 * starts empty and shows the skeletons.
 */
export interface UseJobsOptions {
	initialData?: Paginated<JobSummary>;
	initialKey?: string;
}

export const useJobs = (query: JobsQuery, options: UseJobsOptions = {}) => {
	const key = jobsQueryKey(query);
	const seeded = options.initialData !== undefined && options.initialKey === key[1];

	return useQuery({
		queryKey: key,
		queryFn: ({ signal }) => fetchJobs(query, signal),
		initialData: seeded ? options.initialData : undefined,
		// Keeps the previous page on screen while the next one loads instead of collapsing
		// the list to skeletons on every pagination click.
		placeholderData: keepPreviousData,
	});
};

/** Taxonomy labels. Static between crawls, so it is cached for the session. */
export const useReference = (initialData?: ReferenceCatalog) =>
	useQuery({
		queryKey: ["reference"],
		queryFn: ({ signal }) => fetchReference(signal),
		initialData,
		staleTime: 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
	});
