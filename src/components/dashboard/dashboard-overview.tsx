"use client";

import { JobCard } from "@/components/jobs/job-card";
import { JobGridSkeleton } from "@/components/jobs/job-card-skeleton";
import { StatTile } from "@/components/common/stat-tile";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useReference } from "@/hooks/use-jobs";
import { SAVED_LIST_KEY } from "@/hooks/use-saved-jobs";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ALERTS_KEY, fetchJobAlerts } from "@/lib/api/job-alerts";
import { fetchSavedJobs } from "@/lib/api/saved-jobs";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReferenceCatalog, ReferenceOption } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import {
	BellRing,
	Bookmark,
	CalendarClock,
	MailCheck,
	MailWarning,
	ShieldCheck,
	Sparkles,
	Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

/** Cards shown in the preview row; the dedicated page holds the rest. */
const PREVIEW = 3;

/**
 * How many saved jobs to actually load.
 *
 * More than the preview shows, because "which of my saved jobs closes first" cannot be
 * answered from the three most recent ones — and it is the question this page exists for.
 */
const SCAN = 50;

const toMap = (options: ReferenceOption[] | undefined): Map<number, ReferenceOption> =>
	new Map((options ?? []).map((option) => [option.id, option]));

function SectionHeading({
	icon: Icon,
	title,
	href,
	viewAll,
}: {
	icon: typeof Bookmark;
	title: string;
	href: string;
	viewAll: string;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<h2 className="flex items-center gap-2 font-semibold text-lg tracking-tight">
				<Icon className="size-4 text-muted-foreground" />
				{title}
			</h2>
			<Button asChild variant="ghost" size="sm">
				<Link href={href}>{viewAll}</Link>
			</Button>
		</div>
	);
}

export function DashboardOverview({
	initialReference,
}: {
	initialReference?: ReferenceCatalog;
}) {
	const { user } = useSession();
	const t = useTranslations("dashboard");
	const tAlerts = useTranslations("alertsPage");
	const tForm = useTranslations("alertForm");
	const tJob = useTranslations("job");
	const locale = useLocale() as Locale;

	const { data: reference } = useReference(initialReference);

	const saved = useQuery({
		// Shares SAVED_LIST_KEY's prefix, so saving or unsaving anywhere invalidates this too.
		queryKey: [...SAVED_LIST_KEY, "preview", SCAN],
		queryFn: ({ signal }) => fetchSavedJobs(1, SCAN, signal),
	});

	const alerts = useQuery({
		queryKey: ALERTS_KEY,
		queryFn: ({ signal }) => fetchJobAlerts(signal),
	});

	// The page was rendered behind requireUser, so this is only ever null for the instant
	// before the session provider hydrates.
	if (!user) return null;

	const lookups = {
		provinces: toMap(reference?.provinces),
		educationLevels: toMap(reference?.educationLevels),
		jobTypes: toMap(reference?.jobTypes),
	};

	// fetchJobAlerts asks for 50, which is far more than anyone has, so deriving these from
	// the loaded page rather than a dedicated count endpoint is honest here.
	const alertRows = alerts.data?.data;
	const activeAlerts = alertRows?.filter((alert) => alert.isActive).length;
	const totalMatches = alertRows?.reduce((sum, alert) => sum + alert.matchCount, 0);

	const savedRows = saved.data?.data ?? [];
	// Already-closed announcements are excluded: a deadline in the past is not a deadline.
	const soonest = savedRows
		.filter((job) => job.daysUntilDeadline !== null && job.daysUntilDeadline >= 0)
		.sort((a, b) => (a.daysUntilDeadline ?? 0) - (b.daysUntilDeadline ?? 0))[0];

	return (
		<div className="space-y-8">
			{/*
			 * Identity and the one thing that is actually urgent, in a single panel.
			 *
			 * These used to be two large, mostly empty cards stacked on top of each other. A
			 * saved announcement closing in three days is the only item on this page that is
			 * time-sensitive, so it belongs beside the name rather than buried in a grid.
			 */}
			<Reveal>
				<Card className="surface-aurora edge-highlight overflow-hidden shadow-sm">
					<CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
						<div className="flex flex-wrap items-center gap-4">
							<span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 font-semibold text-lg text-primary-foreground shadow-sm ring-1 ring-primary/20">
								{user.name.trim().charAt(0).toUpperCase() || "?"}
							</span>

							<div className="min-w-0 flex-1 space-y-1.5">
								<p className="truncate font-semibold text-lg tracking-tight">{user.name}</p>
								<p className="truncate text-muted-foreground text-sm">{user.email}</p>
								<div className="flex flex-wrap items-center gap-2 pt-0.5">
									{user.role === "ADMIN" ? (
										<Badge variant="secondary" className="gap-1">
											<ShieldCheck className="size-3.5" />
											{t("roleAdmin")}
										</Badge>
									) : null}
									<Badge variant={user.isVerified ? "secondary" : "outline"} className="gap-1">
										{user.isVerified ? (
											<MailCheck className="size-3.5" />
										) : (
											<MailWarning className="size-3.5" />
										)}
										{user.isVerified ? t("verified") : t("unverified")}
									</Badge>
								</div>
							</div>
						</div>

						<div className="rounded-xl border bg-card/70 p-4 backdrop-blur-sm">
							<p className="flex items-center gap-1.5 font-medium text-xs">
								<CalendarClock className="size-3.5 text-amber-600 dark:text-amber-400" />
								{t("closingSoonest")}
							</p>

							{saved.isPending ? (
								<Skeleton className="mt-2 h-10 w-full" />
							) : soonest ? (
								<Link
									href={`/jobs/${soonest.id}`}
									className="group mt-2 block space-y-1"
								>
									<p className="line-clamp-1 font-medium text-sm group-hover:text-primary">
										{soonest.title}
									</p>
									<p className="numeric text-muted-foreground text-xs">
										{soonest.daysUntilDeadline === 0
											? tJob("lastDay")
											: tJob("daysLeft", { days: soonest.daysUntilDeadline ?? 0 })}{" "}
										· {formatDate(soonest.applicationEnd, locale)}
									</p>
								</Link>
							) : (
								<p className="mt-2 text-muted-foreground text-xs">{t("noDeadline")}</p>
							)}
						</div>
					</CardContent>
				</Card>
			</Reveal>

			<Stagger gap={0.05} trigger="mount" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StaggerItem>
					<StatTile icon={Bookmark} label={t("statSaved")} value={saved.data?.meta.total} />
				</StaggerItem>
				<StaggerItem>
					<StatTile icon={BellRing} label={t("statAlerts")} value={alerts.data?.meta.total} />
				</StaggerItem>
				<StaggerItem>
					<StatTile icon={Zap} label={t("statActive")} value={activeAlerts} tone="good" toneWhenPositive />
				</StaggerItem>
				<StaggerItem>
					<StatTile icon={Sparkles} label={t("statMatches")} value={totalMatches} />
				</StaggerItem>
			</Stagger>

			<section className="space-y-4">
				<SectionHeading
					icon={Bookmark}
					title={t("recentSaved")}
					href="/saved"
					viewAll={t("viewAll")}
				/>

				{saved.isPending ? (
					<JobGridSkeleton count={PREVIEW} />
				) : savedRows.length > 0 ? (
					<Stagger gap={0.05} trigger="mount" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{savedRows.slice(0, PREVIEW).map((job) => (
							<StaggerItem key={job.id} className="relative">
								<JobCard job={job} {...lookups} />
							</StaggerItem>
						))}
					</Stagger>
				) : (
					<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
						<p className="text-muted-foreground text-sm">{t("noSaved")}</p>
						<Button asChild size="sm">
							<Link href="/jobs">{t("browseJobs")}</Link>
						</Button>
					</div>
				)}
			</section>

			<section className="space-y-4">
				<SectionHeading
					icon={BellRing}
					title={t("yourAlerts")}
					href="/alerts"
					viewAll={t("viewAll")}
				/>

				{alerts.isPending ? (
					<div className="space-y-3">
						{Array.from({ length: PREVIEW }, (_, index) => (
							<Skeleton key={index} className="h-20 w-full rounded-xl" />
						))}
					</div>
				) : alertRows && alertRows.length > 0 ? (
					<div className="space-y-3">
						{alertRows.slice(0, PREVIEW).map((alert) => (
							<Card
								key={alert.id}
								className="group shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/30 hover:shadow-md"
							>
								<CardContent className="flex flex-wrap items-center gap-4 py-3.5">
									{/* A paused alert is dimmed at the dot, so the state reads before the words do. */}
									<span
										aria-hidden
										className={cn(
											"size-2 shrink-0 rounded-full",
											alert.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
										)}
									/>

									<div className="min-w-0 flex-1 space-y-0.5">
										<Link
											href={`/alerts/${alert.id}/edit`}
											className="block truncate font-medium text-sm group-hover:text-primary"
										>
											{alert.name}
										</Link>
										<p className="numeric truncate text-muted-foreground text-xs">
											{tAlerts("matchingSince")} {formatDate(alert.matchFrom, locale)}
										</p>
									</div>

									<div className="flex shrink-0 items-center gap-2">
										<Badge variant="outline" className="font-normal">
											{tForm(`frequency${alert.frequency}` as "frequencyIMMEDIATE")}
										</Badge>
										<Badge variant="secondary" className="numeric font-normal">
											{tAlerts("matchCount", { count: alert.matchCount })}
										</Badge>
										{alert.isActive ? null : (
											<Badge variant="outline">{tAlerts("pausedLabel")}</Badge>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
						<p className="text-muted-foreground text-sm">{t("noAlerts")}</p>
						<Button asChild size="sm">
							<Link href="/alerts/create">{t("createAlert")}</Link>
						</Button>
					</div>
				)}
			</section>

			{user.role === "ADMIN" ? (
				<Button asChild variant="outline">
					<Link href="/admin">
						<ShieldCheck className="size-4" />
						{t("openAdmin")}
					</Link>
				</Button>
			) : null}
		</div>
	);
}
