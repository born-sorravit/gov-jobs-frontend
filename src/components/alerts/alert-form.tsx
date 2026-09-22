"use client";

import { KeywordInput } from "@/components/alerts/keyword-input";
import { MultiSelectFilter } from "@/components/jobs/multi-select-filter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReference } from "@/hooks/use-jobs";
import { useRouter } from "@/i18n/navigation";
import { type JobAlertInput, createJobAlert, updateJobAlert } from "@/lib/api/job-alerts";
import type { AlertFrequency, JobAlert, ReferenceCatalog } from "@/types/api";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Briefcase, GraduationCap, Loader2, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const FREQUENCIES: AlertFrequency[] = ["IMMEDIATE", "DAILY", "WEEKLY"];

interface AlertFormProps {
	/** Present when editing; absent when creating. */
	alert?: JobAlert;
	initialReference?: ReferenceCatalog;
	/** Pre-filled from a job the user was looking at, so "create alert" starts useful. */
	defaults?: Partial<JobAlertInput>;
}

export function AlertForm({ alert, initialReference, defaults }: AlertFormProps) {
	const t = useTranslations("alertForm");
	const tJob = useTranslations("job");
	const tCommon = useTranslations("common");
	const tErrors = useTranslations("errors");
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: reference } = useReference(initialReference);

	const [values, setValues] = useState<JobAlertInput>({
		name: alert?.name ?? defaults?.name ?? "",
		keywords: alert?.keywords ?? defaults?.keywords ?? [],
		jobTypes: alert?.jobTypes ?? defaults?.jobTypes ?? [],
		educations: alert?.educations ?? defaults?.educations ?? [],
		provinces: alert?.provinces ?? defaults?.provinces ?? [],
		notificationEmail: alert?.notificationEmail,
		frequency: alert?.frequency ?? "IMMEDIATE",
	});
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const set = <K extends keyof JobAlertInput>(key: K, value: JobAlertInput[K]) =>
		setValues((current) => ({ ...current, [key]: value }));

	const onSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);

		if (!values.name.trim()) {
			setError(t("nameRequired"));
			return;
		}

		// An alert with no criteria at all would match every announcement ever published.
		const hasCriteria =
			values.keywords.length > 0 ||
			values.jobTypes.length > 0 ||
			values.educations.length > 0 ||
			values.provinces.length > 0;
		if (!hasCriteria) {
			setError(t("criteriaRequired"));
			return;
		}

		setSaving(true);
		try {
			if (alert) {
				await updateJobAlert(alert.id, values);
			} else {
				await createJobAlert(values);
			}
			await queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
			toast.success(alert ? t("saved") : t("created"));
			router.push("/alerts");
			router.refresh();
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : tErrors("generic"));
		} finally {
			setSaving(false);
		}
	};

	return (
		<form onSubmit={onSubmit} className="space-y-6">
			{error ? (
				<Alert variant="destructive">
					<AlertCircle className="size-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<Card>
				<CardContent className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="alert-name">{t("name")}</Label>
						<Input
							id="alert-name"
							value={values.name}
							onChange={(event) => set("name", event.target.value)}
							placeholder={t("namePlaceholder")}
							maxLength={120}
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("keywords")}</Label>
						<KeywordInput value={values.keywords} onChange={(next) => set("keywords", next)} />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="space-y-4">
					<div className="space-y-1">
						<p className="font-medium text-sm">{t("filters")}</p>
						<p className="text-muted-foreground text-xs">{t("filtersHint")}</p>
					</div>

					<div className="grid divide-y rounded-lg border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
						<MultiSelectFilter
							label={tJob("province")}
							icon={<MapPin className="size-4 shrink-0 text-muted-foreground" />}
							options={reference?.provinces ?? []}
							selected={values.provinces}
							onChange={(next) => set("provinces", next)}
						/>
						<MultiSelectFilter
							label={tJob("jobType")}
							icon={<Briefcase className="size-4 shrink-0 text-muted-foreground" />}
							options={reference?.jobTypes ?? []}
							selected={values.jobTypes}
							onChange={(next) => set("jobTypes", next)}
						/>
						<MultiSelectFilter
							label={tJob("education")}
							icon={<GraduationCap className="size-4 shrink-0 text-muted-foreground" />}
							options={reference?.educationLevels ?? []}
							selected={values.educations}
							onChange={(next) => set("educations", next)}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="alert-email">{t("notificationEmail")}</Label>
						<Input
							id="alert-email"
							type="email"
							value={values.notificationEmail ?? ""}
							onChange={(event) => set("notificationEmail", event.target.value || undefined)}
							placeholder={t("notificationEmailPlaceholder")}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="alert-frequency">{t("frequency")}</Label>
						<select
							id="alert-frequency"
							value={values.frequency}
							onChange={(event) => set("frequency", event.target.value as AlertFrequency)}
							className="h-9 w-full rounded-md border bg-card px-3 text-sm"
						>
							{FREQUENCIES.map((frequency) => (
								<option key={frequency} value={frequency}>
									{t(`frequency${frequency}` as "frequencyIMMEDIATE")}
								</option>
							))}
						</select>
					</div>
				</CardContent>
			</Card>

			<div className="flex flex-wrap gap-2">
				<Button type="submit" disabled={saving}>
					{saving ? <Loader2 className="size-4 animate-spin" /> : null}
					{alert ? tCommon("save") : t("create")}
				</Button>
				<Button type="button" variant="outline" onClick={() => router.push("/alerts")}>
					{tCommon("cancel")}
				</Button>
			</div>
		</form>
	);
}
