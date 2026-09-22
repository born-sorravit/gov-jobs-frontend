import { AlertForm } from "@/components/alerts/alert-form";
import { AppShell } from "@/components/layout/app-shell";
import type { Locale } from "@/i18n/routing";
import { fetchJob, fetchReference } from "@/lib/api/jobs";
import { requireUser } from "@/lib/auth/require-user";
import type { JobAlertInput } from "@/lib/api/job-alerts";
import type { ReferenceCatalog } from "@/types/api";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "alertsPage" });
	return { title: t("create") };
}

export default async function CreateAlertPage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: Locale }>;
	searchParams: Promise<{ fromJob?: string }>;
}) {
	const [{ locale }, { fromJob }] = await Promise.all([params, searchParams]);
	setRequestLocale(locale);
	await requireUser(fromJob ? `/alerts/create?fromJob=${fromJob}` : "/alerts/create");

	const t = await getTranslations("alertsPage");

	let reference: ReferenceCatalog | undefined;
	try {
		reference = await fetchReference();
	} catch {
		reference = undefined;
	}

	// Arriving from a job detail page: start the alert from that announcement's own
	// attributes, so "alert me about jobs like this one" takes one click and one edit.
	let defaults: Partial<JobAlertInput> | undefined;
	if (fromJob) {
		try {
			const job = await fetchJob(fromJob);
			defaults = {
				name: job.title,
				keywords: [job.title],
				jobTypes: job.jobTypeId ? [job.jobTypeId] : [],
				educations: job.educationLevelIds,
				provinces: job.provinceIds,
			};
		} catch {
			defaults = undefined;
		}
	}

	return (
		<AppShell title={t("create")}>
			<div className="mx-auto w-full max-w-3xl space-y-6">
				<div className="space-y-1">
					<h1 className="font-semibold text-2xl tracking-tight">{t("create")}</h1>
					<p className="text-muted-foreground">{t("createSubtitle")}</p>
				</div>

				<AlertForm initialReference={reference} defaults={defaults} />
			</div>
		</AppShell>
	);
}
