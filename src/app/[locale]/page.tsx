import { JobCard } from "@/components/jobs/job-card";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { fetchJobs, fetchReference } from "@/lib/api/jobs";
import type { JobSummary, ReferenceCatalog, ReferenceOption } from "@/types/api";
import { ArrowRight, Bell, CalendarClock, Search, Sparkles } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

const toMap = (options: ReferenceOption[] | undefined): Map<number, ReferenceOption> =>
	new Map((options ?? []).map((option) => [option.id, option]));

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("app");
	const tHome = await getTranslations("home");
	const tNav = await getTranslations("nav");
	const tJob = await getTranslations("job");

	// Two small server fetches rather than one client component: the landing page should be
	// complete in the HTML. A failure degrades to the hero and the links, never to a crash.
	let latest: JobSummary[] = [];
	let openCount = 0;
	let closingSoon: JobSummary[] = [];
	let reference: ReferenceCatalog | undefined;

	try {
		const [latestPage, closingPage, referenceData] = await Promise.all([
			fetchJobs({ status: "OPEN", limit: 6, sortBy: "publishedAt", order: "DESC" }),
			fetchJobs({ status: "OPEN", limit: 3, sortBy: "applicationEnd", order: "ASC" }),
			fetchReference(),
		]);
		latest = latestPage.data;
		openCount = latestPage.meta.total;
		closingSoon = closingPage.data;
		reference = referenceData;
	} catch {
		// Leave the lists empty; the hero and navigation still work.
	}

	const lookups = {
		provinces: toMap(reference?.provinces),
		educationLevels: toMap(reference?.educationLevels),
		jobTypes: toMap(reference?.jobTypes),
	};

	return (
		<AppShell>
			<div className="mx-auto w-full max-w-7xl space-y-10">
				<section className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-8 lg:p-12">
					<Badge variant="secondary" className="gap-1.5">
						<Sparkles className="size-3.5" />
						job.ocsc.go.th
					</Badge>
					<h1 className="mt-4 max-w-3xl text-balance font-semibold text-3xl tracking-tight lg:text-4xl">
						{t("name")}
					</h1>
					<p className="mt-3 max-w-2xl text-pretty text-muted-foreground lg:text-lg">
						{t("tagline")}
					</p>

					<div className="mt-6 flex flex-wrap items-center gap-3">
						<Button asChild size="lg">
							<Link href="/jobs">
								<Search className="size-4" />
								{tNav("jobs")}
							</Link>
						</Button>
						<Button asChild size="lg" variant="outline">
							<Link href="/alerts">
								<Bell className="size-4" />
								{tNav("alerts")}
							</Link>
						</Button>
						{openCount > 0 ? (
							<span className="text-muted-foreground text-sm">
								{tHome("openNow", { count: openCount })}
							</span>
						) : null}
					</div>
				</section>

				{closingSoon.length > 0 ? (
					<section className="space-y-4">
						<div className="flex items-center gap-2">
							<CalendarClock className="size-5 text-amber-600 dark:text-amber-400" />
							<h2 className="font-semibold text-xl tracking-tight">{tHome("closingSoon")}</h2>
						</div>
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{closingSoon.map((job) => (
								<div key={job.id} className="relative">
									<JobCard job={job} {...lookups} />
								</div>
							))}
						</div>
					</section>
				) : null}

				<section className="space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 className="font-semibold text-xl tracking-tight">{tHome("latest")}</h2>
						<Button asChild variant="ghost" size="sm">
							<Link href="/jobs">
								{tHome("viewAll")}
								<ArrowRight className="size-4" />
							</Link>
						</Button>
					</div>

					{latest.length > 0 ? (
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{latest.map((job) => (
								<div key={job.id} className="relative">
									<JobCard job={job} {...lookups} />
								</div>
							))}
						</div>
					) : (
						<Card>
							<CardContent className="py-12 text-center text-muted-foreground">
								{tHome("noJobs")}
							</CardContent>
						</Card>
					)}
				</section>

				{/* Filter entry points: deep links into /jobs, so the landing page teaches the URL
				    shape as well as offering a shortcut. */}
				{reference ? (
					<section className="grid gap-4 md:grid-cols-3">
						{(
							[
								["province", tJob("province"), reference.provinces.slice(0, 6)],
								["jobType", tJob("jobType"), reference.jobTypes.filter((o) => o.id !== 0).slice(0, 6)],
								["education", tJob("education"), reference.educationLevels.slice(0, 6)],
							] as const
						).map(([field, label, options]) => (
							<Card key={field}>
								<CardContent className="space-y-3">
									<h3 className="font-medium text-sm">{label}</h3>
									<div className="flex flex-wrap gap-2">
										{options.map((option) => (
											<Button key={option.id} asChild variant="outline" size="sm">
												<Link href={`/jobs?${field}=${option.id}`}>
													{locale === "en" ? (option.nameEn ?? option.nameTh) : option.nameTh}
												</Link>
											</Button>
										))}
									</div>
								</CardContent>
							</Card>
						))}
					</section>
				) : null}
			</div>
		</AppShell>
	);
}
