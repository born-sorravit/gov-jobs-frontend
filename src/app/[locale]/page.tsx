import { JobCard } from "@/components/jobs/job-card";
import { AppShell } from "@/components/layout/app-shell";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
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

/**
 * One figure from the hero panel.
 *
 * Value and label on one line rather than stacked: three stacked pairs made the panel taller
 * than the copy beside it and left the hero looking half-empty.
 */
function Stat({ value, label }: { value: number; label: string }) {
	return (
		<div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
			<span className="numeric font-semibold text-2xl tracking-tight">
				{value.toLocaleString()}
			</span>
			<span className="text-muted-foreground text-xs">{label}</span>
		</div>
	);
}

function SectionHeading({
	title,
	hint,
	icon,
	action,
}: {
	title: string;
	hint?: string;
	icon?: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-3">
			<div className="space-y-0.5">
				<h2 className="flex items-center gap-2 font-semibold text-xl tracking-tight">
					{icon}
					{title}
				</h2>
				{hint ? <p className="text-muted-foreground text-sm">{hint}</p> : null}
			</div>
			{action}
		</div>
	);
}

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

	// Position-type id 0 is the source's own "ไม่มีข้อมูล" placeholder, never a real type.
	const realJobTypes = (reference?.jobTypes ?? []).filter((option) => option.id !== 0);

	return (
		<AppShell>
			<div className="mx-auto w-full max-w-7xl space-y-12">
				<Reveal>
					<section className="surface-aurora edge-highlight relative overflow-hidden rounded-3xl border bg-card p-8 shadow-md lg:p-12">
						<div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
							<div>
								<Badge variant="secondary" className="gap-1.5 backdrop-blur">
									<Sparkles className="size-3.5" />
									job.ocsc.go.th
								</Badge>
								<h1 className="mt-5 text-balance font-semibold text-4xl leading-[1.15] tracking-tight lg:text-5xl">
									{t("name")}
								</h1>
								<p className="mt-4 max-w-xl text-pretty text-muted-foreground lg:text-lg">
									{t("tagline")}
								</p>

								<div className="mt-7 flex flex-wrap items-center gap-3">
									<Button asChild size="lg" className="shadow-sm">
										<Link href="/jobs">
											<Search className="size-4" />
											{tNav("jobs")}
										</Link>
									</Button>
									<Button asChild size="lg" variant="outline" className="bg-card/60 backdrop-blur">
										<Link href="/alerts">
											<Bell className="size-4" />
											{tNav("alerts")}
										</Link>
									</Button>
								</div>
							</div>

							{/* The figures earn the right-hand half the old hero left empty, and they are
							    the first evidence that the data behind the page is real. */}
							{reference ? (
								<div className="divide-y rounded-2xl border bg-card/75 shadow-sm backdrop-blur-sm">
									<Stat value={openCount} label={tHome("statOpen")} />
									<Stat value={reference.provinces.length} label={tHome("statProvinces")} />
									<Stat value={realJobTypes.length} label={tHome("statTypes")} />
								</div>
							) : null}
						</div>
					</section>
				</Reveal>

				{closingSoon.length > 0 ? (
					<section className="space-y-5">
						<SectionHeading
							title={tHome("closingSoon")}
							hint={tHome("closingSoonHint")}
							icon={<CalendarClock className="size-5 text-amber-600 dark:text-amber-400" />}
						/>
						<Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{closingSoon.map((job) => (
								<StaggerItem key={job.id}>
									<JobCard job={job} {...lookups} />
								</StaggerItem>
							))}
						</Stagger>
					</section>
				) : null}

				<section className="space-y-5">
					<SectionHeading
						title={tHome("latest")}
						action={
							<Button asChild variant="ghost" size="sm" className="group">
								<Link href="/jobs">
									{tHome("viewAll")}
									<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
								</Link>
							</Button>
						}
					/>

					{latest.length > 0 ? (
						<Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{latest.map((job) => (
								<StaggerItem key={job.id}>
									<JobCard job={job} {...lookups} />
								</StaggerItem>
							))}
						</Stagger>
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
					<section className="space-y-5">
						<SectionHeading title={tHome("browseBy")} />
						<Stagger className="grid gap-4 md:grid-cols-3">
							{(
								[
									["province", tJob("province"), reference.provinces.slice(0, 6)],
									["jobType", tJob("jobType"), realJobTypes.slice(0, 6)],
									["education", tJob("education"), reference.educationLevels.slice(0, 6)],
								] as const
							).map(([field, label, options]) => (
								<StaggerItem key={field}>
									<Card className="h-full shadow-sm">
										<CardContent className="space-y-3">
											<h3 className="font-medium text-sm">{label}</h3>
											<div className="flex flex-wrap gap-2">
												{options.map((option) => (
													<Button
														key={option.id}
														asChild
														variant="outline"
														size="sm"
														className="rounded-full font-normal transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
													>
														<Link href={`/jobs?${field}=${option.id}`}>
															{locale === "en" ? (option.nameEn ?? option.nameTh) : option.nameTh}
														</Link>
													</Button>
												))}
											</div>
										</CardContent>
									</Card>
								</StaggerItem>
							))}
						</Stagger>
					</section>
				) : null}
			</div>
		</AppShell>
	);
}
