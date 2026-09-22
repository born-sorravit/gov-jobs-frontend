import { Providers } from "@/components/providers/providers";
import { getCurrentUser } from "@/lib/auth/session";
import { type Locale, routing } from "@/i18n/routing";
import "@/app/globals.css";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "app" });

	return {
		title: { default: t("name"), template: `%s · ${t("name")}` },
		description: t("description"),
	};
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	// Required for the static rendering of every page under this segment.
	setRequestLocale(locale);

	// Read once here and handed to every client component, so nothing renders a signed-out
	// header for a moment before discovering there is a session. Middleware has already
	// refreshed a stale token by this point, so this never sees one.
	const user = await getCurrentUser();

	return (
		<html
			lang={locale}
			suppressHydrationWarning
			className={cn(fontVariables, "h-full antialiased")}
		>
			<body className="flex min-h-full flex-col">
				<NextIntlClientProvider>
					<Providers initialUser={user}>
						{children}
					</Providers>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
