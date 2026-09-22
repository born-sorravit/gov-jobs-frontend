import { StatTile } from "@/components/home/stat-tile";
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
import {
	ArrowRight,
	Bell,
	CalendarClock,
	FileText,
	Globe,
	Layers,
	MapPin,
	Search,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

const toMap = (options: ReferenceOption[] | undefined): Map<number, ReferenceOption> =>
	new Map((options ?? []).map((option) => [option.id, option]));

/**
 * The line art behind the hero.
 *
 * Drawn rather than photographed: the hero is mostly empty between the copy and the figures,
 * and a photograph there would fight the text for attention. Strokes only, at an opacity low
 * enough that nothing above it loses contrast.
 */
function HeroBuilding() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 360 200"
			className="pointer-events-none absolute right-[42%] bottom-0 hidden h-[44%] w-auto text-primary opacity-[0.10] lg:block dark:opacity-20"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M180 30V8" />
			<path d="M180 8h22l-5 5 5 5h-22z" fill="currentColor" fillOpacity="0.35" stroke="none" />
			<path d="M173 38h14v-8h-14z" />
			<path d="M150 72a30 34 0 0 1 60 0" />
			<path d="M146 72h68" />
			<path d="M120 104l60-32 60 32" />
			<path d="M48 104h264" />
			<path d="M48 112h264" />
			<path d="M60 112v48M84 112v48M108 112v48M132 112v48M156 112v48M180 112v48M204 112v48M228 112v48M252 112v48M276 112v48M300 112v48" />
			<path d="M36 160h288" />
			<path d="M28 168h304" />
			<path d="M20 176h320" />
			<path d="M0 200c40-26 78-14 118-2s84 18 122-4 80-16 120 6" strokeOpacity="0.6" />
		</svg>
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
						<HeroBuilding />

						<div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
							<div>
								{/* A live dot rather than a decorative sparkle: the badge names where the
								    announcements come from, and the pulse says the feed is current. */}
								<Badge
									variant="outline"
									className="h-7 gap-2 border-border bg-card/50 px-3 backdrop-blur"
								>
									<span className="relative flex size-1.5">
										<span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-1/70" />
										<span className="relative inline-flex size-1.5 rounded-full bg-chart-1" />
									</span>
									<Globe className="text-muted-foreground" />
									job.ocsc.go.th
								</Badge>

								{/* `w-fit`: the ramp is painted across the element box, so a full-width h1 would
								    spend most of the gradient on empty space and leave the word itself white. */}
								<h1 className="text-brand-gradient mt-5 w-fit text-balance font-semibold text-4xl leading-[1.25] tracking-tight lg:text-5xl">
									{t("name")}
								</h1>
								<p className="mt-4 max-w-xl text-pretty text-muted-foreground lg:text-lg">
									{t("tagline")}
								</p>

								<div className="mt-7 flex flex-wrap items-center gap-3">
									<Button
										asChild
										size="lg"
										className="brand-gradient h-11 rounded-full px-6 text-primary-foreground text-sm shadow-lg shadow-primary/25 hover:brightness-110"
									>
										<Link href="/jobs">
											<Search className="size-4" />
											{tNav("jobs")}
											<ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
										</Link>
									</Button>
									<Button
										asChild
										size="lg"
										variant="outline"
										className="h-11 rounded-full bg-card/50 px-6 text-sm backdrop-blur"
									>
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
								<div className="space-y-2.5 rounded-3xl border bg-card/35 p-2.5 shadow-sm backdrop-blur-sm">
									<StatTile
										value={openCount}
										label={tHome("statOpen")}
										icon={<FileText className="size-5" />}
										href="/jobs?status=OPEN"
										tint="var(--chart-1)"
										locale={locale}
									/>
									<StatTile
										value={reference.provinces.length}
										label={tHome("statProvinces")}
										icon={<MapPin className="size-5" />}
										href="/jobs"
										tint="var(--chart-3)"
										locale={locale}
									/>
									<StatTile
										value={realJobTypes.length}
										label={tHome("statTypes")}
										icon={<Layers className="size-5" />}
										href="/jobs"
										tint="var(--chart-4)"
										locale={locale}
									/>
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
