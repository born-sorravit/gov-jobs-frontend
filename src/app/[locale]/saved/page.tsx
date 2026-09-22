import { SavedJobsList } from "@/components/jobs/saved-jobs-list";
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
	const t = await getTranslations({ locale, namespace: "savedPage" });
	return { title: t("title") };
}

export default async function SavedPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = await params;
	setRequestLocale(locale);

	// Bounces to /login?next=/saved and comes back here afterwards.
	await requireUser("/saved");

	const t = await getTranslations("savedPage");

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
					<h2 className="font-semibold text-2xl tracking-tight">{t("title")}</h2>
					<p className="text-muted-foreground">{t("subtitle")}</p>
				</div>

				<SavedJobsList initialReference={reference} />
			</div>
		</AppShell>
	);
}
