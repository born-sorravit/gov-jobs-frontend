import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Two different situations, two different messages: filters that matched nothing (offer a
 * way out) versus a genuinely empty database (nothing the user can do).
 */
export function JobsEmptyState({
	filtered,
	onClearAll,
}: {
	filtered: boolean;
	onClearAll: () => void;
}) {
	const t = useTranslations("errors");
	const tCommon = useTranslations("common");

	return (
		<div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-20 text-center">
			<div className="flex size-12 items-center justify-center rounded-full bg-muted">
				<SearchX className="size-6 text-muted-foreground" />
			</div>
			<div className="space-y-1">
				<p className="font-medium">{filtered ? t("empty") : t("noJobsYet")}</p>
				<p className="max-w-sm text-muted-foreground text-sm">
					{filtered ? t("emptyHint") : t("noJobsYetHint")}
				</p>
			</div>
			{filtered ? (
				<Button variant="outline" onClick={onClearAll}>
					{tCommon("clearAll")}
				</Button>
			) : null}
		</div>
	);
}
