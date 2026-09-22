import { AlertsList } from "@/components/alerts/alerts-list";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { fetchReference } from "@/lib/api/jobs";
import { requireUser } from "@/lib/auth/require-user";
import type { ReferenceCatalog } from "@/types/api";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "alertsPage" });
	return { title: t("title") };
}

export default async function AlertsPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = await params;
	setRequestLocale(locale);
	await requireUser("/alerts");

	const t = await getTranslations("alertsPage");

	let reference: ReferenceCatalog | undefined;
	try {
		reference = await fetchReference();
	} catch {
		reference = undefined;
	}

	return (
		<AppShell title={t("title")}>
			<div className="mx-auto w-full max-w-4xl space-y-6">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="space-y-1">
						<h2 className="font-semibold text-2xl tracking-tight">{t("title")}</h2>
						<p className="text-muted-foreground">{t("subtitle")}</p>
					</div>
					<Button asChild>
						<Link href="/alerts/create">
							<Plus className="size-4" />
							{t("create")}
						</Link>
					</Button>
				</div>

				<AlertsList initialReference={reference} />
			</div>
		</AppShell>
	);
}
