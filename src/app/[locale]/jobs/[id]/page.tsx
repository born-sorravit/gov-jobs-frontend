import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import {
	AgencySeal,
	JobBreadcrumb,
	JobFact,
	JobFactCard,
	JobTextSection,
} from "@/components/jobs/job-detail-sections";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ApiError } from "@/lib/api-client";
import { fetchJob, fetchReference } from "@/lib/api/jobs";
import { deadlineTone, formatDate, formatSalaryRange, referenceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { JobDetail, ReferenceCatalog, ReferenceOption } from "@/types/api";
import {
	BellPlus,
	CalendarClock,
	ClipboardList,
	ExternalLink,
	FileText,
	GraduationCap,
	Layers,
	MapPin,
	Scale,
	Users,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

/**
 * Loads the announcement, distinguishing "does not exist" from "could not be reached".
 *
 * Only a 404 becomes `notFound()`. A cold backend or a network blip must not render a
 * "this job doesn't exist" page for an announcement that does — Next would cache that.
 */
async function loadJob(id: string): Promise<JobDetail> {
	try {
		return await fetchJob(id);
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) {
			notFound();
		}
		throw error;
	}
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: Locale; id: string }>;
}): Promise<Metadata> {
	const { locale, id } = await params;

	try {
		const job = await fetchJob(id);
		const t = await getTranslations({ locale, namespace: "jobDetail" });

		return {
			title: job.title,
			description: `${job.agency}${job.ministry ? ` · ${job.ministry}` : ""} — ${t("metaDescription")}`,
			alternates: { canonical: `/jobs/${id}` },
		};
	} catch {
		return {};
	}
}

const label = (
	options: ReferenceOption[] | undefined,
	id: number | null,
	locale: Locale
): string | null => {
	// Id 0 is the source's own "no data" placeholder in several taxonomies.
	if (!id) return null;
	return referenceLabel(options?.find((option) => option.id === id), locale);
};

export default async function JobDetailPage({
	params,
}: {
	params: Promise<{ locale: Locale; id: string }>;
}) {
	const { locale, id } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("job");
	const tDetail = await getTranslations("jobDetail");
	const tNav = await getTranslations("nav");
	const tCommon = await getTranslations("common");

	const job = await loadJob(id);
	let reference: ReferenceCatalog | undefined;
	try {
		reference = await fetchReference();
	} catch {
		reference = undefined;
	}

	// Shared across the free-text sections so an identical body is printed once.
	const renderedBodies = new Set<string>();

	const salary = formatSalaryRange(job.salaryMin, job.salaryMax, locale);
	const provinceNames = job.provinceIds
		.map((provinceId) => referenceLabel(reference?.provinces.find((p) => p.id === provinceId), locale))
		.filter(Boolean);
	const educationNames = job.educationLevelIds
		.map((eduId) => referenceLabel(reference?.educationLevels.find((e) => e.id === eduId), locale))
		.filter(Boolean);

	const jobType = label(reference?.jobTypes, job.jobTypeId, locale);
	const jobLevel = label(reference?.jobLevels, job.jobLevelId, locale);
	const jobCategory = label(reference?.jobCategories, job.jobCategoryId, locale);
	const jobSelection = label(reference?.jobSelections, job.jobSelectionId, locale);
	const jobCondition = job.jobConditionOther ?? label(reference?.jobConditions, job.jobConditionId, locale);

	return (
		<AppShell title={job.title}>
			<div className="mx-auto w-full max-w-6xl space-y-6">
				<JobBreadcrumb
					label={tCommon("breadcrumb")}
					home={tNav("home")}
					jobs={tNav("jobs")}
					current={job.title}
				/>

				{/*
				 * The title block sits on a card like everything else on the page. Floating it bare
				 * on the tinted background left the most important element as the only one with no
				 * surface under it, which read as the page starting halfway down.
				 */}
				<Card>
					<CardContent>
						<header className="flex items-start gap-4">
							{/* The seal is how a reader recognises the issuing agency at a glance, and it
							    was already in the payload and already whitelisted in `next.config.ts`. */}
							<AgencySeal src={job.agencySealUrl} className="size-11 sm:size-14" />

							<div className="min-w-0 flex-1 space-y-3">
								<div className="flex flex-wrap items-center gap-2">
									<JobStatusBadge status={job.status} />
									{jobCategory ? <Badge variant="secondary">{jobCategory}</Badge> : null}
									{job.isNationwide ? <Badge variant="outline">{t("nationwide")}</Badge> : null}
								</div>

								{/*
								 * Thai stacks สระบน and วรรณยุกต์ above the character and สระล่าง below, so a
								 * line of it inks taller than the Latin the default leading was scaled for.
								 * Measured on a wrapping title at 24px: the ink box is 31px against
								 * `leading-tight`'s 30px line box, so consecutive lines overlap by a pixel.
								 * 1.35 gives 32.4px — clearance instead of collision, without the slack of
								 * `leading-relaxed`, which at 39px would space a two-line title like prose.
								 */}
								<h1 className="text-balance font-semibold text-2xl leading-[1.35] tracking-tight lg:text-3xl">
									{job.title}
								</h1>

								<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-sm">
									{/* No icon here: the seal beside it already says "agency", and two marks for
									    one fact is one too many. */}
									<span className="font-medium text-foreground">{job.agency}</span>
									{job.ministry ? (
										<>
											<span aria-hidden className="text-muted-foreground/50">
												·
											</span>
											<span>{job.ministry}</span>
										</>
									) : null}
								</div>
							</div>
						</header>
					</CardContent>
				</Card>

				<div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
					<div className="min-w-0 space-y-6">
						<JobFactCard>
							<JobFact icon={<MapPin className="size-4" />} label={t("province")}>
								{job.isNationwide ? t("nationwide") : (provinceNames.join(", ") || "—")}
							</JobFact>

							<JobFact icon={<GraduationCap className="size-4" />} label={t("education")}>
								{educationNames.join(", ") || job.educationLevelOther || "—"}
							</JobFact>

							{jobType ? (
								<JobFact icon={<Layers className="size-4" />} label={t("jobType")}>
									{jobType}
									{jobLevel ? <span className="text-muted-foreground"> · {jobLevel}</span> : null}
								</JobFact>
							) : null}

							{jobSelection ? (
								<JobFact icon={<ClipboardList className="size-4" />} label={tDetail("selection")}>
									{jobSelection}
								</JobFact>
							) : null}

							{job.positionAmount ? (
								<JobFact icon={<Users className="size-4" />} label={t("positions")}>
									{job.positionAmount}
								</JobFact>
							) : null}

							{job.examDate || job.interviewDate ? (
								<JobFact icon={<CalendarClock className="size-4" />} label={tDetail("examDates")}>
									{[job.examDate, job.interviewDate]
										.filter(Boolean)
										.map((date) => formatDate(date, locale))
										.join(" · ")}
								</JobFact>
							) : null}
						</JobFactCard>

						<Card>
							<CardContent className="space-y-6">
								<JobTextSection
									title={tDetail("qualifications")}
									body={job.educationRequirements}
									seen={renderedBodies}
								/>
								<JobTextSection
									title={tDetail("description")}
									body={job.description}
									seen={renderedBodies}
								/>
								<JobTextSection
									title={tDetail("knowledge")}
									body={job.knowledge}
									seen={renderedBodies}
								/>
								<JobTextSection title={tDetail("skill")} body={job.skill} seen={renderedBodies} />
								<JobTextSection
									title={tDetail("competency")}
									body={job.competency}
									seen={renderedBodies}
								/>
								<JobTextSection
									title={tDetail("criteria")}
									body={job.criteria}
									seen={renderedBodies}
								/>
								{jobCondition ? (
									<JobTextSection
										title={tDetail("conditions")}
										body={jobCondition}
										seen={renderedBodies}
									/>
								) : null}
							</CardContent>
						</Card>
					</div>

					<aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
						<Card>
							<CardContent className="space-y-5">
								<div className="space-y-2">
									<p className="text-muted-foreground text-xs">{t("applicationPeriod")}</p>
									<p className="numeric font-medium text-sm">
										{formatDate(job.applicationStart, locale)} – {formatDate(job.applicationEnd, locale)}
									</p>
									{/*
									 * The countdown decides whether anything else on this card matters, so it is
									 * the one element here allowed to carry colour. Under a week it turns amber —
									 * the same threshold and the same tone the cards in the list use, so a reader
									 * who learned it there does not have to learn it twice.
									 */}
									{job.daysUntilDeadline !== null && job.daysUntilDeadline >= 0 ? (
										<p
											className={cn(
												"inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium text-sm",
												deadlineTone(job.daysUntilDeadline) === "urgent"
													? "bg-amber-500/12 text-amber-800 dark:text-amber-300"
													: "bg-muted text-muted-foreground"
											)}
										>
											<CalendarClock className="size-3.5 shrink-0" />
											{job.daysUntilDeadline === 0
												? t("lastDay")
												: t("daysLeft", { days: job.daysUntilDeadline })}
										</p>
									) : null}
								</div>

								{salary ? (
									<>
										<Separator />
										<div className="space-y-1">
											<p className="text-muted-foreground text-xs">{t("salary")}</p>
											<p className="inline-flex items-baseline gap-1.5">
												<span className="numeric font-semibold text-lg tracking-tight">
													{salary}
												</span>
												<span className="text-muted-foreground text-xs">{t("salaryUnit")}</span>
											</p>
										</div>
									</>
								) : null}

								<Separator />

								{/*
								 * Four buttons of near-equal weight is not a choice, it is a wall — the reader
								 * has to read all four to find the one they want. So: one filled primary, one
								 * outlined secondary, and the two that only change state on this site demoted
								 * below a rule.
								 *
								 * The original announcement stays the primary action, not the apply link. This
								 * site is an index of public announcements; a user must always be able to reach
								 * the source and verify what we are showing them.
								 */}
								<div className="space-y-2">
									<Button asChild size="lg" className="w-full">
										<a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
											<FileText className="size-4" />
											{t("viewSource")}
										</a>
									</Button>

									{job.applyUrl ? (
										<Button asChild variant="outline" className="w-full">
											<a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
												<ExternalLink className="size-4" />
												{t("applyNow")}
											</a>
										</Button>
									) : null}

									<Separator className="my-3" />

									<SaveJobButton jobId={job.id} variant="quiet" />

									{/* Pre-fills the new alert from this announcement, so "tell me about jobs
									    like this" is one click plus one edit. */}
									<Button asChild variant="ghost" className="w-full justify-start">
										<Link href={`/alerts/create?fromJob=${job.id}`}>
											<BellPlus className="size-4" />
											{t("createAlert")}
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>

						{job.attachments.length > 0 ? (
							<Card>
								<CardContent className="space-y-3">
									<p className="font-medium text-sm">{t("attachments")}</p>
									<ul className="space-y-2">
										{job.attachments.map((attachment) => (
											<li key={attachment.id}>
												<a
													href={attachment.url}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-start gap-2 text-primary text-sm hover:underline"
												>
													<FileText className="mt-0.5 size-4 shrink-0" />
													<span className="min-w-0 break-words">{attachment.name}</span>
												</a>
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						) : null}

						{/*
						 * A disclaimer on its own card asks to be read like the content above it. It is
						 * a footnote — so it gets footnote treatment, and the rail drops from three
						 * stacked surfaces to two.
						 */}
						<div className="space-y-2 px-1 text-muted-foreground text-xs">
							<p className="flex items-start gap-1.5">
								<Scale className="mt-0.5 size-3.5 shrink-0" />
								<span>{tDetail("sourceNotice")}</span>
							</p>
							{job.publishedAt ? (
								<p className="pl-5">
									{t("publishedAt")}: {formatDate(job.publishedAt, locale)}
								</p>
							) : null}
						</div>
					</aside>
				</div>
			</div>
		</AppShell>
	);
}
