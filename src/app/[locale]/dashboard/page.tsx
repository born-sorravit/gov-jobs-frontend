import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { AppShell } from "@/components/layout/app-shell";
import type { Locale } from "@/i18n/routing";
import { fetchReference } from "@/lib/api/jobs";
import { requireUser } from "@/lib/auth/require-user";
import type { ReferenceCatalog } from "@/types/api";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "dashboard" });
	// Someone's own account page has no business in a search index.
	return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ locale: Locale }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	// Bounces to /login?next=/dashboard and comes back here afterwards.
	await requireUser("/dashboard");

	const t = await getTranslations("dashboard");

	// Taxonomy labels are public, so they are fetched directly rather than through the proxy.
	let reference: ReferenceCatalog | undefined;
	try {
		reference = await fetchReference();
	} catch {
		reference = undefined;
	}

	return (
		<AppShell title={t("title")}>
			<div className="mx-auto w-full max-w-7xl space-y-6">
				<div className="space-y-1">
					<h1 className="font-semibold text-2xl tracking-tight">{t("title")}</h1>
					<p className="text-muted-foreground">{t("subtitle")}</p>
				</div>

				<DashboardOverview initialReference={reference} />
			</div>
		</AppShell>
	);
}
