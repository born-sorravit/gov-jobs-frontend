"use client";

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
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const dateTime = (value: string | null, locale: Locale): string => {
	if (!value) return "—";
	return new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-buddhist" : "en-GB", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "Asia/Bangkok",
	}).format(new Date(value));
};

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" | "bad" }) {
	return (
		<Card>
			<CardContent className="space-y-1 py-4">
				<p className="text-muted-foreground text-xs">{label}</p>
				<p
					className={cn(
						"font-semibold text-2xl tabular-nums",
						tone === "warn" && value > 0 && "text-amber-600 dark:text-amber-400",
						tone === "bad" && value > 0 && "text-destructive"
					)}
				>
					{value.toLocaleString()}
				</p>
			</CardContent>
		</Card>
	);
}

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
							<th key={label} className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground text-xs">
								{label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, index) => (
						<tr key={index} className="border-b last:border-0">
							{row.map((cell, cellIndex) => (
								<td key={cellIndex} className="px-3 py-2.5 align-top">
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
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 8 }, (_, index) => (
					<Skeleton key={index} className="h-20 rounded-xl" />
				))}
			</div>
		);
	}

	const data = overview.data;
	const last = data?.lastCrawlerRun;

	return (
		<div className="space-y-6">
			{/* Crawler health first: everything else on this page depends on it running. */}
			<Card className={data && data.consecutiveFailures > 0 ? "border-destructive/50" : undefined}>
				<CardContent className="space-y-3">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h3 className="font-medium">{t("crawlerHealth")}</h3>
						{last ? <RunStatus run={last} /> : null}
					</div>

					{last ? (
						<div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
							<div>
								<span className="text-muted-foreground text-xs">{t("lastRun")}</span>
								<p>{dateTime(last.startedAt, locale)}</p>
							</div>
							<div>
								<span className="text-muted-foreground text-xs">{t("found")}</span>
								<p className="tabular-nums">
									{last.totalFound} · +{last.newJobs} / ~{last.updatedJobs}
								</p>
							</div>
							<div>
								<span className="text-muted-foreground text-xs">{t("duration")}</span>
								<p className="tabular-nums">
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
						<p className="text-destructive text-sm">
							{t("consecutiveFailures", { count: data.consecutiveFailures })}
						</p>
					) : null}
				</CardContent>
			</Card>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Stat label={t("jobs")} value={data?.jobs ?? 0} />
				<Stat label={t("openJobs")} value={data?.openJobs ?? 0} />
				<Stat label={t("users")} value={data?.users ?? 0} />
				<Stat label={t("alerts")} value={data?.alerts ?? 0} />
				<Stat label={t("alertMatches")} value={data?.alertMatches ?? 0} />
				<Stat label={t("pendingNotifications")} value={data?.pendingNotifications ?? 0} tone="warn" />
				<Stat label={t("emailsSent")} value={data?.emailsSent ?? 0} />
				<Stat label={t("emailsFailed")} value={data?.emailsFailed ?? 0} tone="bad" />
			</div>

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
