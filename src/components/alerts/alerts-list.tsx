"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { deleteJobAlert, fetchJobAlerts, setJobAlertActive } from "@/lib/api/job-alerts";
import { formatDate, referenceLabel } from "@/lib/format";
import { useReference } from "@/hooks/use-jobs";
import type { JobAlert, ReferenceCatalog, ReferenceOption } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellOff, BellRing, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

const ALERTS_KEY = ["job-alerts"] as const;

function CriteriaChips({
	alert,
	reference,
	locale,
}: {
	alert: JobAlert;
	reference?: ReferenceCatalog;
	locale: Locale;
}) {
	const t = useTranslations("alertForm");

	const named = (ids: number[], options: ReferenceOption[] | undefined) =>
		ids.map((id) => referenceLabel(options?.find((o) => o.id === id), locale));

	const groups: [string, string[]][] = [
		[t("keywords"), alert.keywords],
		[t("provinces"), named(alert.provinces, reference?.provinces)],
		[t("jobTypes"), named(alert.jobTypes, reference?.jobTypes)],
		[t("educations"), named(alert.educations, reference?.educationLevels)],
	];

	return (
		<div className="space-y-1.5">
			{groups
				.filter(([, values]) => values.length > 0)
				.map(([label, values]) => (
					<div key={label} className="flex flex-wrap items-baseline gap-1.5 text-sm">
						<span className="text-muted-foreground text-xs">{label}:</span>
						{values.slice(0, 4).map((value) => (
							<Badge key={value} variant="secondary" className="font-normal">
								{value}
							</Badge>
						))}
						{values.length > 4 ? (
							<span className="text-muted-foreground text-xs">+{values.length - 4}</span>
						) : null}
					</div>
				))}
		</div>
	);
}

export function AlertsList({ initialReference }: { initialReference?: ReferenceCatalog }) {
	const locale = useLocale() as Locale;
	const t = useTranslations("alertsPage");
	const tForm = useTranslations("alertForm");
	const tErrors = useTranslations("errors");
	const queryClient = useQueryClient();
	const { data: reference } = useReference(initialReference);

	const { data, isPending } = useQuery({
		queryKey: ALERTS_KEY,
		queryFn: ({ signal }) => fetchJobAlerts(signal),
	});

	const invalidate = () => queryClient.invalidateQueries({ queryKey: ALERTS_KEY });

	const toggle = useMutation({
		mutationFn: ({ id, active }: { id: string; active: boolean }) => setJobAlertActive(id, active),
		onSuccess: (_result, { active }) => {
			void invalidate();
			// Resuming moves the matching floor, so the user should know it will not report
			// announcements found while it was off.
			toast.success(active ? t("resumed") : t("paused"));
		},
		onError: () => toast.error(tErrors("generic")),
	});

	const remove = useMutation({
		mutationFn: (id: string) => deleteJobAlert(id),
		onSuccess: () => {
			void invalidate();
			toast.success(t("deleted"));
		},
		onError: () => toast.error(tErrors("generic")),
	});

	if (isPending) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 2 }, (_, index) => (
					<Card key={index}>
						<CardContent className="space-y-3">
							<Skeleton className="h-5 w-48" />
							<Skeleton className="h-4 w-full max-w-md" />
							<Skeleton className="h-4 w-32" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (!data || data.data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-20 text-center">
				<div className="flex size-12 items-center justify-center rounded-full bg-muted">
					<BellOff className="size-6 text-muted-foreground" />
				</div>
				<div className="space-y-1">
					<p className="font-medium">{t("empty")}</p>
					<p className="max-w-sm text-muted-foreground text-sm">{t("emptyHint")}</p>
				</div>
				<Button asChild>
					<Link href="/alerts/create">{t("create")}</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{data.data.map((alert) => (
				<Card key={alert.id} className={alert.isActive ? undefined : "opacity-75"}>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0 space-y-1">
								<div className="flex flex-wrap items-center gap-2">
									<h3 className="font-medium">{alert.name}</h3>
									<Badge variant={alert.isActive ? "secondary" : "outline"}>
										{alert.isActive ? t("active") : t("pausedLabel")}
									</Badge>
								</div>
								<p className="text-muted-foreground text-sm">
									{tForm(`frequency${alert.frequency}` as "frequencyIMMEDIATE")} ·{" "}
									{alert.notificationEmail}
								</p>
							</div>

							<div className="flex items-center gap-1">
								<Switch
									checked={alert.isActive}
									disabled={toggle.isPending}
									onCheckedChange={(checked) => toggle.mutate({ id: alert.id, active: checked })}
									aria-label={alert.isActive ? t("pause") : t("resume")}
								/>
								<Button asChild variant="ghost" size="icon" aria-label={t("edit")}>
									<Link href={`/alerts/${alert.id}/edit`}>
										<Pencil className="size-4" />
									</Link>
								</Button>
								<Button
									variant="ghost"
									size="icon"
									aria-label={t("delete")}
									disabled={remove.isPending}
									onClick={() => {
										if (confirm(t("confirmDelete", { name: alert.name }))) {
											remove.mutate(alert.id);
										}
									}}
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
						</div>

						<CriteriaChips alert={alert} reference={reference} locale={locale} />

						<div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-muted-foreground text-xs">
							<span className="inline-flex items-center gap-1.5">
								<BellRing className="size-3.5" />
								{t("matchCount", { count: alert.matchCount })}
							</span>
							<span>
								{t("matchingSince")}: {formatDate(alert.matchFrom, locale)}
							</span>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
