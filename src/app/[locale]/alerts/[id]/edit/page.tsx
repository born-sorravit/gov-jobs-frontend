import { AlertForm } from "@/components/alerts/alert-form";
import { AppShell } from "@/components/layout/app-shell";
import type { Locale } from "@/i18n/routing";
import { fetchReference } from "@/lib/api/jobs";
import { requireUser } from "@/lib/auth/require-user";
import { getServerJobAlert } from "@/lib/api/job-alerts.server";
import type { ReferenceCatalog } from "@/types/api";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "alertsPage" });
	return { title: t("edit") };
}

export default async function EditAlertPage({
	params,
}: {
	params: Promise<{ locale: Locale; id: string }>;
}) {
	const { locale, id } = await params;
	setRequestLocale(locale);
	await requireUser(`/alerts/${id}/edit`);

	const t = await getTranslations("alertsPage");

	// Loaded on the server so the form renders filled in, rather than empty then populated.
	const alert = await getServerJobAlert(id);
	if (!alert) notFound();

	let reference: ReferenceCatalog | undefined;
	try {
		reference = await fetchReference();
	} catch {
		reference = undefined;
	}

	return (
		<AppShell title={t("edit")}>
			<div className="mx-auto w-full max-w-3xl space-y-6">
				<div className="space-y-1">
					<h1 className="font-semibold text-2xl tracking-tight">{t("edit")}</h1>
					<p className="text-muted-foreground">{alert.name}</p>
				</div>

				<AlertForm alert={alert} initialReference={reference} />
			</div>
		</AppShell>
	);
}
