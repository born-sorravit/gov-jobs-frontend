import { AccountSettings } from "@/components/account/account-settings";
import { AppShell } from "@/components/layout/app-shell";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/require-user";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "account" });
	// Someone's own settings have no business in a search index.
	return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AccountPage({
	params,
}: {
	params: Promise<{ locale: Locale }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	// Bounces to /login?next=/account and comes back here afterwards.
	await requireUser("/account");

	const t = await getTranslations("account");

	return (
		<AppShell title={t("title")}>
			<div className="mx-auto w-full max-w-2xl space-y-6">
				<div className="space-y-1">
					<h1 className="font-semibold text-2xl tracking-tight">{t("title")}</h1>
					<p className="text-muted-foreground">{t("subtitle")}</p>
				</div>

				<AccountSettings />
			</div>
		</AppShell>
	);
}
