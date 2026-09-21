"use client";

import { ActiveFilterChips } from "@/components/jobs/active-filter-chips";
import { JobCard } from "@/components/jobs/job-card";
import { JobGridSkeleton } from "@/components/jobs/job-card-skeleton";
import { JobSearchBar } from "@/components/jobs/job-search-bar";
import { JobsEmptyState } from "@/components/jobs/jobs-empty-state";
import { JobsPagination } from "@/components/jobs/jobs-pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useJobs, useReference } from "@/hooks/use-jobs";
import { useRouter } from "@/i18n/navigation";
import { JOB_STATUSES, buildJobsSearchParams, hasActiveFilters, parseJobsSearchParams } from "@/lib/jobs-query";
import type { JobSummary, JobsQuery, Paginated, ReferenceCatalog, ReferenceOption } from "@/types/api";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

interface JobsBrowserProps {
	/** The page the server rendered, and the serialised query it corresponds to. */
	initialData?: Paginated<JobSummary>;
	initialKey?: string;
	initialReference?: ReferenceCatalog;
}

const toMap = (options: ReferenceOption[] | undefined): Map<number, ReferenceOption> =>
	new Map((options ?? []).map((option) => [option.id, option]));

export function JobsBrowser({ initialData, initialKey, initialReference }: JobsBrowserProps) {
	const t = useTranslations("common");
	const tJobs = useTranslations("jobsPage");
	const tStatus = useTranslations("jobStatus");
	const tErrors = useTranslations("errors");
	const router = useRouter();
	const searchParams = useSearchParams();

	// The URL is the source of truth: filters survive a reload, are shareable, and the back
	// button steps through them. The same parser runs on the server, so the first client
	// render produces the identical query.
	const query = useMemo(() => parseJobsSearchParams(searchParams), [searchParams]);

	const { data: reference } = useReference(initialReference);
	const { data, isPending, isFetching, isError, error, refetch } = useJobs(query, {
		initialData,
		initialKey,
	});

	/** Any filter change resets to page 1 — staying on page 7 of a narrower result is a dead end. */
	const update = (next: Partial<JobsQuery>) => {
		const merged: JobsQuery = { ...query, ...next, page: next.page ?? 1 };
		const params = buildJobsSearchParams(merged).toString();
		router.push(params ? `/jobs?${params}` : "/jobs", { scroll: false });
	};

	const lookups = useMemo(
		() => ({
			provinces: toMap(reference?.provinces),
			educationLevels: toMap(reference?.educationLevels),
			jobTypes: toMap(reference?.jobTypes),
		}),
		[reference]
	);

	return (
		<div className="space-y-6">
			<JobSearchBar query={query} reference={reference} onSubmit={update} />

			<div className="flex flex-wrap items-center justify-between gap-3">
				<ActiveFilterChips
					query={query}
					reference={reference}
					onChange={update}
					onClearAll={() => router.push("/jobs", { scroll: false })}
				/>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant={query.status ? "outline" : "secondary"}
						size="sm"
						onClick={() => update({ status: undefined })}
					>
						{tJobs("allStatuses")}
					</Button>
					{JOB_STATUSES.map((status) => (
						<Button
							key={status}
							variant={query.status === status ? "secondary" : "outline"}
							size="sm"
							onClick={() => update({ status })}
						>
							{tStatus(status)}
						</Button>
					))}
				</div>

				<div className="flex items-center gap-3">
					{data ? (
						<span className="text-muted-foreground text-sm tabular-nums">
							{tJobs("resultCount", { count: data.meta.total })}
						</span>
					) : null}
					<select
						value={`${query.sortBy ?? "publishedAt"}:${query.order ?? "DESC"}`}
						onChange={(event) => {
							const [sortBy, order] = event.target.value.split(":");
							update({ sortBy: sortBy as JobsQuery["sortBy"], order: order as "ASC" | "DESC" });
						}}
						aria-label={tJobs("sortBy")}
						className="h-9 rounded-md border bg-card px-3 text-sm"
					>
						<option value="publishedAt:DESC">{tJobs("sortNewest")}</option>
						<option value="applicationEnd:ASC">{tJobs("sortClosingSoon")}</option>
						<option value="salaryMax:DESC">{tJobs("sortSalaryHigh")}</option>
						<option value="title:ASC">{tJobs("sortTitle")}</option>
					</select>
				</div>
			</div>

			{isError ? (
				<Alert variant="destructive">
					<AlertCircle className="size-4" />
					<AlertTitle>{tErrors("generic")}</AlertTitle>
					<AlertDescription className="flex flex-col items-start gap-3">
						<span>{error instanceof Error ? error.message : null}</span>
						<Button variant="outline" size="sm" onClick={() => refetch()}>
							{t("retry")}
						</Button>
					</AlertDescription>
				</Alert>
			) : isPending ? (
				<JobGridSkeleton count={query.limit ?? 12} />
			) : data.data.length === 0 ? (
				<JobsEmptyState
					filtered={hasActiveFilters(query)}
					onClearAll={() => router.push("/jobs", { scroll: false })}
				/>
			) : (
				<>
					{/* keepPreviousData leaves the old page up while the next loads; dimming is the
					    only cue that something is in flight. */}
					<div
						className={
							isFetching
								? "grid gap-4 opacity-60 transition-opacity sm:grid-cols-2 xl:grid-cols-3"
								: "grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3"
						}
					>
						{data.data.map((job) => (
							<div key={job.id} className="relative">
								<JobCard job={job} {...lookups} />
							</div>
						))}
					</div>

					<JobsPagination meta={data.meta} onPageChange={(page) => update({ page })} />
				</>
			)}
		</div>
	);
}
