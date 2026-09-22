"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { AlertCircle, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The page rethrows anything that is not a 404, so this is what a backend outage looks
 * like. On a free-tier host a cold start can outlast the fetch timeout, which makes this
 * the likely failure rather than an exotic one — and without it the user would get Next's
 * bare default boundary instead of the app shell.
 */
export default function JobDetailError({ reset }: { error: Error; reset: () => void }) {
	const t = useTranslations("errors");
	const tDetail = useTranslations("jobDetail");
	const tCommon = useTranslations("common");

	return (
		<AppShell>
			<div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
				<div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
					<AlertCircle className="size-6 text-destructive" />
				</div>
				<div className="space-y-1">
					<p className="font-medium">{t("generic")}</p>
					<p className="text-muted-foreground text-sm">{t("unreachableHint")}</p>
				</div>
				<div className="flex flex-wrap items-center justify-center gap-2">
					<Button onClick={reset}>
						<RotateCw className="size-4" />
						{tCommon("retry")}
					</Button>
					<Button asChild variant="outline">
						<Link href="/jobs">{tDetail("backToJobs")}</Link>
					</Button>
				</div>
			</div>
		</AppShell>
	);
}
