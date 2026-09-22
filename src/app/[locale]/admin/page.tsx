import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import type { Locale } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth/require-user";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "admin" });
	// Nothing here should ever be indexed.
	return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AdminPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = await params;
	setRequestLocale(locale);

	// Signed out -> sign in; signed in without the role -> 404. The API re-reads the role
	// from the database on every admin request, so this is the affordance, not the boundary.
	await requireAdmin("/admin");

	const t = await getTranslations("admin");

	return (
		<AppShell title={t("title")}>
			<div className="mx-auto w-full max-w-7xl space-y-6">
				<div className="space-y-1">
					<h2 className="font-semibold text-2xl tracking-tight">{t("title")}</h2>
					<p className="text-muted-foreground">{t("subtitle")}</p>
				</div>

				<AdminDashboard />
			</div>
		</AppShell>
	);
}
