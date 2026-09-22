import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FileQuestion } from "lucide-react";
import { useTranslations } from "next-intl";

export default function JobNotFound() {
	const t = useTranslations("errors");
	const tDetail = useTranslations("jobDetail");

	return (
		<AppShell>
			<div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
				<div className="flex size-12 items-center justify-center rounded-full bg-muted">
					<FileQuestion className="size-6 text-muted-foreground" />
				</div>
				<div className="space-y-1">
					<p className="font-medium">{t("notFound")}</p>
					{/* Announcements come off the portal when they close, so a dead link is expected. */}
					<p className="text-muted-foreground text-sm">{tDetail("notFoundHint")}</p>
				</div>
				<Button asChild>
					<Link href="/jobs">{tDetail("backToJobs")}</Link>
				</Button>
			</div>
		</AppShell>
	);
}
