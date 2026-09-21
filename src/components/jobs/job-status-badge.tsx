import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types/api";
import { useTranslations } from "next-intl";

const TONE: Record<JobStatus, string> = {
	OPEN: "border-emerald-600/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
	UPCOMING: "border-amber-600/25 bg-amber-500/12 text-amber-700 dark:text-amber-300",
	CLOSED: "border-border bg-muted text-muted-foreground",
};

export function JobStatusBadge({ status, className }: { status: JobStatus; className?: string }) {
	const t = useTranslations("jobStatus");

	return (
		<Badge variant="outline" className={cn("shrink-0 font-medium", TONE[status], className)}>
			{t(status)}
		</Badge>
	);
}
