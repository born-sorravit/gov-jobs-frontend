"use client";

import { useSession } from "@/components/providers/session-provider";
import { fetchSavedJobIds, saveJob, unsaveJob } from "@/lib/api/saved-jobs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export const SAVED_IDS_KEY = ["saved-job-ids"] as const;
export const SAVED_LIST_KEY = ["saved-jobs"] as const;

/**
 * The set of announcements this user has saved.
 *
 * Fetched as bare ids rather than folded into `GET /jobs`, which stays public and cacheable
 * for everyone. A signed-out visitor never makes the request at all.
 */
export function useSavedJobIds() {
	const { user } = useSession();

	const query = useQuery({
		queryKey: SAVED_IDS_KEY,
		queryFn: ({ signal }) => fetchSavedJobIds(signal),
		enabled: Boolean(user),
		staleTime: 60_000,
	});

	const ids = useMemo(() => new Set(query.data ?? []), [query.data]);

	return { ids, isLoading: query.isLoading };
}

/**
 * Toggles one announcement, optimistically.
 *
 * Touches the two keys that actually hold saved state: the id set and the saved list. The
 * `["jobs", …]` keys are left alone — marking there happens client-side from the id set, so
 * invalidating them would refetch every cached page for nothing.
 */
export function useToggleSavedJob() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ jobId, saved }: { jobId: string; saved: boolean }) =>
			saved ? unsaveJob(jobId) : saveJob(jobId),

		onMutate: async ({ jobId, saved }) => {
			await queryClient.cancelQueries({ queryKey: SAVED_IDS_KEY });
			const previous = queryClient.getQueryData<string[]>(SAVED_IDS_KEY) ?? [];

			queryClient.setQueryData<string[]>(
				SAVED_IDS_KEY,
				saved ? previous.filter((id) => id !== jobId) : [...previous, jobId]
			);

			return { previous };
		},

		onError: (_error, _variables, context) => {
			// Put the old set back rather than leaving the button lying about the state.
			if (context?.previous) {
				queryClient.setQueryData(SAVED_IDS_KEY, context.previous);
			}
		},

		onSettled: () => {
			void queryClient.invalidateQueries({ queryKey: SAVED_IDS_KEY });
			// The saved *list* holds saved state too — without this, unsaving from /saved
			// leaves the card sitting there. The `["jobs", …]` keys are deliberately left
			// alone: they carry no saved state, so refetching them would be pure waste.
			void queryClient.invalidateQueries({ queryKey: SAVED_LIST_KEY });
		},
	});
}
