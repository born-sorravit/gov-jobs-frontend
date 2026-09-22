"use client";

import { RunHistoryStrip } from "@/components/admin/run-history-strip";
import { StatTile } from "@/components/common/stat-tile";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/i18n/routing";
import {
	type AdminEmailLog,
	type CrawlerRun,
	fetchAdminAlerts,
	fetchAdminEmailLogs,
	fetchAdminUsers,
	fetchCrawlerRuns,
	fetchOverview,
} from "@/lib/api/admin";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
	AlertTriangle,
	Bell,
	CheckCircle2,
	Clock,
	FileText,
	MailCheck,
	MailWarning,
	MailX,
	Sparkles,
	Users,
	Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const dateTime = (value: string | null, locale: Locale): string => {
	if (!value) return "—";
	return new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-buddhist" : "en-GB", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "Asia/Bangkok",
	}).format(new Date(value));
};

function RunStatus({ run }: { run: CrawlerRun }) {
	const t = useTranslations("admin");
	const map = {
		SUCCESS: { icon: CheckCircle2, className: "text-emerald-600 dark:text-emerald-400" },
		FAILED: { icon: AlertTriangle, className: "text-destructive" },
		RUNNING: { icon: Clock, className: "text-muted-foreground" },
	} as const;
	const { icon: Icon, className } = map[run.status];

	return (
		<span className={cn("inline-flex items-center gap-1.5 font-medium text-sm", className)}>
			<Icon className="size-4" />
			{t(`status${run.status}` as "statusSUCCESS")}
		</span>
	);
}

function EmailStatusBadge({ log }: { log: AdminEmailLog }) {
	const variant =
		log.status === "SENT" ? "secondary" : log.status === "FAILED" ? "destructive" : "outline";
	return <Badge variant={variant}>{log.status}</Badge>;
}

/** A plain table — this is an operations view, and density beats decoration. */
function DataTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
	const t = useTranslations("admin");

	if (rows.length === 0) {
		return <p className="py-10 text-center text-muted-foreground text-sm">{t("noData")}</p>;
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b text-left">
						{head.map((label) => (
							<th
								key={label}
								className="whitespace-nowrap px-3 py-2.5 font-medium text-muted-foreground text-xs"
							>
								{label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, index) => (
						<tr
							key={index}
							className="border-b transition-colors last:border-0 hover:bg-muted/40"
						>
							{row.map((cell, cellIndex) => (
								<td key={cellIndex} className="numeric px-3 py-2.5 align-top">
									{cell}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export function AdminDashboard() {
	const locale = useLocale() as Locale;
	const t = useTranslations("admin");

	const overview = useQuery({ queryKey: ["admin", "overview"], queryFn: ({ signal }) => fetchOverview(signal) });
	const runs = useQuery({ queryKey: ["admin", "runs"], queryFn: ({ signal }) => fetchCrawlerRuns(signal) });
	const users = useQuery({ queryKey: ["admin", "users"], queryFn: ({ signal }) => fetchAdminUsers(signal) });
	const alerts = useQuery({ queryKey: ["admin", "alerts"], queryFn: ({ signal }) => fetchAdminAlerts(signal) });
	const emails = useQuery({ queryKey: ["admin", "emails"], queryFn: ({ signal }) => fetchAdminEmailLogs(signal) });

	if (overview.isPending) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-44 rounded-xl" />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 8 }, (_, index) => (
						<Skeleton key={index} className="h-20 rounded-xl" />
					))}
				</div>
			</div>
		);
	}

	const data = overview.data;
	const last = data?.lastCrawlerRun;
	const failing = Boolean(data && data.consecutiveFailures > 0);

	return (
		<div className="space-y-6">
			{/* Crawler health first: everything else on this page depends on it running. */}
			<Reveal>
				<Card
					className={cn(
						"overflow-hidden shadow-sm",
						failing ? "border-destructive/50" : "surface-aurora edge-highlight"
					)}
				>
					<CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
						<div className="space-y-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<h2 className="font-medium">{t("crawlerHealth")}</h2>
								{last ? <RunStatus run={last} /> : null}
							</div>

							{last ? (
								<div className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
									<div>
										<span className="text-muted-foreground text-xs">{t("lastRun")}</span>
										<p>{dateTime(last.startedAt, locale)}</p>
									</div>
									<div>
										<span className="text-muted-foreground text-xs">{t("found")}</span>
										<p className="numeric">
											{last.totalFound} · +{last.newJobs} / ~{last.updatedJobs}
										</p>
									</div>
									<div>
										<span className="text-muted-foreground text-xs">{t("duration")}</span>
										<p className="numeric">
											{last.durationSeconds === null ? "—" : `${last.durationSeconds}s`}
										</p>
									</div>
									<div>
										<span className="text-muted-foreground text-xs">{t("trigger")}</span>
										<p>{last.trigger}</p>
									</div>
								</div>
							) : (
								<p className="text-muted-foreground text-sm">{t("noRuns")}</p>
							)}

							{last?.errorMessage ? (
								<p className="rounded-lg bg-destructive/10 px-3 py-2 font-mono text-destructive text-xs">
									{last.errorMessage}
								</p>
							) : null}

							{data && data.consecutiveFailures > 1 ? (
								<p className="flex items-center gap-2 font-medium text-destructive text-sm">
									<AlertTriangle className="size-4 shrink-0" />
									{t("consecutiveFailures", { count: data.consecutiveFailures })}
								</p>
							) : null}
						</div>

						{/* The shape of the last twenty runs, which the table below cannot show. */}
						<div className="space-y-2 rounded-xl border bg-card/60 p-4 backdrop-blur-sm">
							<div className="flex items-baseline justify-between gap-3">
								<span className="font-medium text-xs">{t("runHistory")}</span>
								<span className="text-muted-foreground text-xs">{t("runHistoryHint")}</span>
							</div>
							{runs.isPending ? (
								<Skeleton className="h-12 w-full" />
							) : (
								<RunHistoryStrip
									runs={runs.data?.data ?? []}
									label={(run) =>
										`${dateTime(run.startedAt, locale)} · ${t(`status${run.status}` as "statusSUCCESS")} · ${run.totalFound}`
									}
								/>
							)}
						</div>
					</CardContent>
				</Card>
			</Reveal>

			<Stagger trigger="mount" gap={0.04} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{(
					[
						[FileText, t("jobs"), data?.jobs, "default"],
						[Zap, t("openJobs"), data?.openJobs, "good"],
						[Users, t("users"), data?.users, "default"],
						[Bell, t("alerts"), data?.alerts, "default"],
						[Sparkles, t("alertMatches"), data?.alertMatches, "default"],
						[MailWarning, t("pendingNotifications"), data?.pendingNotifications, "warn"],
						[MailCheck, t("emailsSent"), data?.emailsSent, "default"],
						[MailX, t("emailsFailed"), data?.emailsFailed, "bad"],
					] as const
				).map(([icon, label, value, tone]) => (
					<StaggerItem key={label}>
						<StatTile
							icon={icon}
							label={label}
							value={value}
							tone={tone}
							// "0 failed" and "0 awaiting" are good news; only colour them once they are not.
							toneWhenPositive={tone === "warn" || tone === "bad"}
						/>
					</StaggerItem>
				))}
			</Stagger>

			<Tabs defaultValue="runs">
				<TabsList>
					<TabsTrigger value="runs">{t("tabRuns")}</TabsTrigger>
					<TabsTrigger value="users">{t("tabUsers")}</TabsTrigger>
					<TabsTrigger value="alerts">{t("tabAlerts")}</TabsTrigger>
					<TabsTrigger value="emails">{t("tabEmails")}</TabsTrigger>
				</TabsList>

				<TabsContent value="runs">
					<Card>
						<CardContent className="px-0">
							<DataTable
								head={[t("colStarted"), t("colStatus"), t("colFound"), t("colMatches"), t("colDuration"), t("colError")]}
								rows={(runs.data?.data ?? []).map((run) => [
									dateTime(run.startedAt, locale),
									<RunStatus key="s" run={run} />,
									`${run.totalFound} · +${run.newJobs} / ~${run.updatedJobs}`,
									run.alertMatches,
									run.durationSeconds === null ? "—" : `${run.durationSeconds}s`,
									<span key="e" className="text-destructive text-xs">{run.errorMessage ?? "—"}</span>,
								])}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="users">
					<Card>
						<CardContent className="px-0">
							<DataTable
								head={[t("colEmail"), t("colName"), t("colRole"), t("colAlerts"), t("colSaved"), t("colJoined")]}
								rows={(users.data?.data ?? []).map((user) => [
									user.email,
									user.name,
									<Badge key="r" variant={user.role === "ADMIN" ? "secondary" : "outline"}>{user.role}</Badge>,
									user.alertCount,
									user.savedJobCount,
									formatDate(user.createdAt, locale),
								])}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="alerts">
					<Card>
						<CardContent className="px-0">
							<DataTable
								head={[t("colAlert"), t("colOwner"), t("colFrequency"), t("colActive"), t("colMatches"), t("colLastSent")]}
								rows={(alerts.data?.data ?? []).map((alert) => [
									alert.name,
									alert.ownerEmail,
									alert.frequency,
									<Badge key="a" variant={alert.isActive ? "secondary" : "outline"}>
										{alert.isActive ? t("active") : t("paused")}
									</Badge>,
									alert.matchCount,
									dateTime(alert.lastSentAt, locale),
								])}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="emails">
					<Card>
						<CardContent className="px-0">
							<DataTable
								head={[t("colSent"), t("colTo"), t("colSubject"), t("colTemplate"), t("colStatus")]}
								rows={(emails.data?.data ?? []).map((log) => [
									dateTime(log.sentAt ?? log.createdAt, locale),
									log.toEmail,
									<span key="s" className="line-clamp-1 max-w-80">{log.subject}</span>,
									<span key="t" className="text-muted-foreground text-xs">{log.template}</span>,
									<EmailStatusBadge key="b" log={log} />,
								])}
							/>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
