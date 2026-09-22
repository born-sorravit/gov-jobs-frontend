"use client";

import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { HoverLift } from "@/components/motion/reveal";
import { trackSpotlight } from "@/components/motion/spotlight";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { deadlineTone, formatDate, formatSalaryRange, referenceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { JobSummary, ReferenceOption } from "@/types/api";
import { Banknote, Building2, CalendarClock, GraduationCap, MapPin, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface JobCardProps {
	job: JobSummary;
	provinces: Map<number, ReferenceOption>;
	educationLevels: Map<number, ReferenceOption>;
	jobTypes: Map<number, ReferenceOption>;
}

/** At most two names plus a "+N" chip, so a job listing 12 provinces cannot blow up the card. */
function IdList({
	ids,
	lookup,
	locale,
	fallback,
	icon,
}: {
	ids: number[];
	lookup: Map<number, ReferenceOption>;
	locale: Locale;
	fallback: string;
	icon: React.ReactNode;
}) {
	const labels = ids.map((id) => referenceLabel(lookup.get(id), locale));
	const shown = labels.slice(0, 2);
	const rest = labels.length - shown.length;

	return (
		<span className="inline-flex min-w-0 items-center gap-1.5">
			{icon}
			<span className="truncate">{labels.length === 0 ? fallback : shown.join(", ")}</span>
			{rest > 0 ? <span className="shrink-0 text-muted-foreground/70">+{rest}</span> : null}
		</span>
	);
}

export function JobCard({ job, provinces, educationLevels, jobTypes }: JobCardProps) {
	const locale = useLocale() as Locale;
	const t = useTranslations("job");
	const salary = formatSalaryRange(job.salaryMin, job.salaryMax, locale);
	const tone = deadlineTone(job.daysUntilDeadline);

	return (
		<HoverLift className="relative">
			<Card
				onPointerMove={trackSpotlight}
				className="spotlight-border group relative h-full gap-0 overflow-hidden py-0 shadow-sm transition-shadow duration-300 hover:shadow-lg"
			>
				{/* The lit top edge this used to draw is now the whole rim's job — `spotlight-border`
				    above. Kept as one fixed hairline it pinned the light to the top of the card while
				    the rest of the edge followed the pointer, which read as two effects disagreeing. */}
				<CardContent className="flex h-full flex-col gap-4 p-5">
					<div className="flex items-start justify-between gap-3">
						<Link
							href={`/jobs/${job.id}`}
							className="min-w-0 font-semibold text-base leading-snug tracking-tight transition-colors after:absolute after:inset-0 group-hover:text-primary"
						>
							<span className="line-clamp-2">{job.title}</span>
						</Link>
						<div className="flex shrink-0 items-center gap-1">
							<JobStatusBadge status={job.status} />
							<SaveJobButton jobId={job.id} />
						</div>
					</div>

					<div className="min-w-0 space-y-1 text-muted-foreground text-sm">
						<span className="flex min-w-0 items-center gap-1.5">
							<Building2 className="size-3.5 shrink-0" />
							<span className="truncate">{job.agency}</span>
						</span>
						{job.ministry ? <p className="truncate pl-5 text-xs">{job.ministry}</p> : null}
					</div>

					<div className="grid gap-2 text-muted-foreground text-sm">
						{/* A job with no province is nationwide, not missing data — it says so. */}
						{job.isNationwide ? (
							<span className="inline-flex items-center gap-1.5">
								<MapPin className="size-3.5 shrink-0" />
								<Badge variant="secondary" className="font-normal text-xs">
									{t("nationwide")}
								</Badge>
							</span>
						) : (
							<IdList
								ids={job.provinceIds}
								lookup={provinces}
								locale={locale}
								fallback="—"
								icon={<MapPin className="size-3.5 shrink-0" />}
							/>
						)}

						<IdList
							ids={job.educationLevelIds}
							lookup={educationLevels}
							locale={locale}
							fallback="—"
							icon={<GraduationCap className="size-3.5 shrink-0" />}
						/>

						{salary ? (
							<span className="inline-flex items-center gap-1.5">
								<Banknote className="size-3.5 shrink-0" />
								<span className="truncate">
									{salary} <span className="text-xs">{t("salaryUnit")}</span>
								</span>
							</span>
						) : null}
					</div>

					<div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
						<span
							className={cn(
								"inline-flex items-center gap-1.5",
								tone === "urgent" && "font-medium text-amber-800 dark:text-amber-300",
								tone === "past" && "text-muted-foreground",
								tone === "normal" && "text-muted-foreground"
							)}
						>
							<CalendarClock className="size-3.5 shrink-0" />
							{job.daysUntilDeadline === null
								? formatDate(job.applicationEnd, locale)
								: job.daysUntilDeadline === 0
									? t("lastDay")
									: job.daysUntilDeadline > 0
										? t("daysLeft", { days: job.daysUntilDeadline })
										: formatDate(job.applicationEnd, locale)}
						</span>

						<span className="inline-flex items-center gap-3 text-muted-foreground">
							{/* Position-type id 0 is the source's own "ไม่มีข้อมูล" placeholder — rendering it
							    would put a chip that says "no data" on a third of the cards. */}
							{job.jobTypeId ? (
								<span className="truncate">{referenceLabel(jobTypes.get(job.jobTypeId), locale)}</span>
							) : null}
							{job.positionAmount ? (
								<span className="inline-flex items-center gap-1">
									<Users className="size-3.5" />
									{job.positionAmount}
								</span>
							) : null}
						</span>
					</div>
				</CardContent>
			</Card>
		</HoverLift>
	);
}
