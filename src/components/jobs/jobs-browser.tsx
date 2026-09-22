"use client";

import { ActiveFilterChips } from "@/components/jobs/active-filter-chips";
import { Segmented } from "@/components/common/segmented";
import { JobCard } from "@/components/jobs/job-card";
import { JobGridSkeleton } from "@/components/jobs/job-card-skeleton";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { JobSearchBar } from "@/components/jobs/job-search-bar";
import { JobsEmptyState } from "@/components/jobs/jobs-empty-state";
import { JobsPagination } from "@/components/jobs/jobs-pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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

			{/*
			 * No wrapper here on purpose. This used to sit in a flex row, and because
			 * `ActiveFilterChips` returns null when nothing is filtered, the empty row still
			 * collected a `space-y-6` gap above and below it — 48px of nothing between the
			 * search bar and the results on the default, unfiltered view. The component owns
			 * its own row now, so returning null removes the layout with it.
			 */}
			<ActiveFilterChips
				query={query}
				reference={reference}
				onChange={update}
				onClearAll={() => router.push("/jobs", { scroll: false })}
			/>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<Segmented
					label={tJobs("sortBy")}
					value={query.status ?? "ALL"}
					onChange={(next) => update({ status: next === "ALL" ? undefined : next })}
					options={[
						{ value: "ALL" as const, label: tJobs("allStatuses") },
						...JOB_STATUSES.map((status) => ({ value: status, label: tStatus(status) })),
					]}
				/>

				<div className="flex items-center gap-3">
					{data ? (
						<span className="text-muted-foreground text-sm tabular-nums">
							{tJobs("resultCount", { count: data.meta.total })}
						</span>
					) : null}
					{/*
					 * The one native control left on a page built from Radix primitives: it drew the
					 * OS dropdown, ignored the border radius and the dark palette, and sat a pixel
					 * off the segmented control beside it. Same value shape as before — one
					 * `sortBy:order` string — so the parsing is unchanged.
					 */}
					<Select
						value={`${query.sortBy ?? "publishedAt"}:${query.order ?? "DESC"}`}
						onValueChange={(next) => {
							const [sortBy, order] = next.split(":");
							update({ sortBy: sortBy as JobsQuery["sortBy"], order: order as "ASC" | "DESC" });
						}}
					>
						<SelectTrigger aria-label={tJobs("sortBy")} className="bg-card">
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="end">
							<SelectItem value="publishedAt:DESC">{tJobs("sortNewest")}</SelectItem>
							<SelectItem value="applicationEnd:ASC">{tJobs("sortClosingSoon")}</SelectItem>
							<SelectItem value="salaryMax:DESC">{tJobs("sortSalaryHigh")}</SelectItem>
							<SelectItem value="title:ASC">{tJobs("sortTitle")}</SelectItem>
						</SelectContent>
					</Select>
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
					{/*
					 * Keyed on the page so a page change replays the entrance. Without the key the
					 * grid keeps the same DOM nodes and the new results simply appear, which reads
					 * as nothing having happened.
					 */}
					<Stagger
						key={data.meta.page}
						gap={0.04}
						trigger="mount"
						className={
							isFetching
								? "grid gap-4 opacity-60 transition-opacity sm:grid-cols-2 xl:grid-cols-3"
								: "grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3"
						}
					>
						{data.data.map((job) => (
							<StaggerItem key={job.id} className="relative">
								<JobCard job={job} {...lookups} />
							</StaggerItem>
						))}
					</Stagger>

					<JobsPagination meta={data.meta} onPageChange={(page) => update({ page })} />
				</>
			)}
		</div>
	);
}
