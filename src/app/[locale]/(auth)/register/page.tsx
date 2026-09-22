import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth/session";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "auth" });
	return { title: t("registerTitle") };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = await params;
	setRequestLocale(locale);

	// Already signed in: there is nothing to do here.
	if (await getCurrentUser()) {
		redirect(locale === "th" ? "/" : `/${locale}`);
	}

	const t = await getTranslations("auth");

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("registerTitle")}</CardTitle>
				<CardDescription>{t("registerSubtitle")}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* AuthForm reads `next` from the query string, which opts it out of static rendering. */}
				<Suspense fallback={<div className="h-64" />}>
					<AuthForm mode="register" />
				</Suspense>

				<p className="text-center text-muted-foreground text-sm">
					{t("registerSwitch")}{" "}
					<Link href="/login" className="font-medium text-primary hover:underline">
						{t("signIn")}
					</Link>
				</p>
			</CardContent>
		</Card>
	);
}
