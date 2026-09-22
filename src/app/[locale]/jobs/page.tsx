import { AppShell } from "@/components/layout/app-shell";
import { JobsBrowser } from "@/components/jobs/jobs-browser";
import type { Locale } from "@/i18n/routing";
import { fetchJobs, fetchReference } from "@/lib/api/jobs";
import { buildJobsSearchParams, parseJobsSearchParams } from "@/lib/jobs-query";
import type { JobSummary, Paginated, ReferenceCatalog } from "@/types/api";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "jobsPage" });
	return { title: t("title"), description: t("subtitle") };
}

export default async function JobsPage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: Locale }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const [{ locale }, rawSearchParams] = await Promise.all([params, searchParams]);
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: "jobsPage" });

	// The same parser the client uses, so the seeded query and the first client render agree.
	const query = parseJobsSearchParams(rawSearchParams);

	// Rendered server-side so the list is in the HTML — this is a public job board and the
	// listings need to be indexable and readable before JS runs. A failure here is not fatal:
	// the client refetches and shows its own error state.
	let initialData: Paginated<JobSummary> | undefined;
	let initialReference: ReferenceCatalog | undefined;

	try {
		[initialData, initialReference] = await Promise.all([fetchJobs(query), fetchReference()]);
	} catch {
		initialData = undefined;
		initialReference = undefined;
	}

	return (
		<AppShell title={t("title")}>
			<div className="mx-auto w-full max-w-7xl space-y-6">
				<div className="space-y-1">
					<h1 className="font-semibold text-2xl tracking-tight">{t("title")}</h1>
					<p className="text-muted-foreground">{t("subtitle")}</p>
				</div>

				<JobsBrowser
					initialData={initialData}
					initialKey={buildJobsSearchParams(query).toString()}
					initialReference={initialReference}
				/>
			</div>
		</AppShell>
	);
}
