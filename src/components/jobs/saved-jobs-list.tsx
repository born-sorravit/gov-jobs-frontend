"use client";

import { JobCard } from "@/components/jobs/job-card";
import { JobGridSkeleton } from "@/components/jobs/job-card-skeleton";
import { JobsPagination } from "@/components/jobs/jobs-pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useReference } from "@/hooks/use-jobs";
import { SAVED_LIST_KEY } from "@/hooks/use-saved-jobs";
import { fetchSavedJobs } from "@/lib/api/saved-jobs";
import { Link } from "@/i18n/navigation";
import type { ReferenceCatalog, ReferenceOption } from "@/types/api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertCircle, BookmarkX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const toMap = (options: ReferenceOption[] | undefined): Map<number, ReferenceOption> =>
	new Map((options ?? []).map((option) => [option.id, option]));

export function SavedJobsList({ initialReference }: { initialReference?: ReferenceCatalog }) {
	const t = useTranslations("savedPage");
	const tCommon = useTranslations("common");
	const tErrors = useTranslations("errors");
	const [page, setPage] = useState(1);

	const { data: reference } = useReference(initialReference);
	const { data, isPending, isError, refetch } = useQuery({
		// The toggle invalidates this key as well as the id set, so unsaving from this page
		// removes the card rather than leaving it behind.
		queryKey: [...SAVED_LIST_KEY, page],
		queryFn: ({ signal }) => fetchSavedJobs(page, 12, signal),
		placeholderData: keepPreviousData,
	});

	const lookups = {
		provinces: toMap(reference?.provinces),
		educationLevels: toMap(reference?.educationLevels),
		jobTypes: toMap(reference?.jobTypes),
	};

	if (isPending) return <JobGridSkeleton count={6} />;

	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertCircle className="size-4" />
				<AlertTitle>{tErrors("generic")}</AlertTitle>
				<AlertDescription>
					<Button variant="outline" size="sm" onClick={() => refetch()}>
						{tCommon("retry")}
					</Button>
				</AlertDescription>
			</Alert>
		);
	}

	if (data.data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-20 text-center">
				<div className="flex size-12 items-center justify-center rounded-full bg-muted">
					<BookmarkX className="size-6 text-muted-foreground" />
				</div>
				<div className="space-y-1">
					<p className="font-medium">{t("empty")}</p>
					<p className="max-w-sm text-muted-foreground text-sm">{t("emptyHint")}</p>
				</div>
				<Button asChild>
					<Link href="/jobs">{t("browseJobs")}</Link>
				</Button>
			</div>
		);
	}

	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{data.data.map((job) => (
					<div key={job.id} className="relative">
						<JobCard job={job} {...lookups} />
					</div>
				))}
			</div>
			<JobsPagination meta={data.meta} onPageChange={setPage} />
		</>
	);
}
