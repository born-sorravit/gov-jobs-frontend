import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * One figure, with an icon that carries its meaning.
 *
 * Both dashboards used to render a label over a number in a tall empty box; eight of those in
 * a grid say nothing about which one matters. The icon gives each tile an identity at a
 * glance and the tone gives the two that can go wrong a colour — but only once they actually
 * have, so a healthy page stays calm.
 */
export type StatTone = "default" | "good" | "warn" | "bad";

const TONES: Record<StatTone, string> = {
	default: "bg-muted text-muted-foreground",
	good: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
	warn: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
	bad: "bg-destructive/10 text-destructive",
};

export function StatTile({
	icon: Icon,
	label,
	value,
	hint,
	tone = "default",
	/** A tone that only applies once the number is non-zero — "0 failed" is good news. */
	toneWhenPositive = false,
}: {
	icon: LucideIcon;
	label: string;
	value: number | undefined;
	hint?: string;
	tone?: StatTone;
	toneWhenPositive?: boolean;
}) {
	const applied = toneWhenPositive && !(value && value > 0) ? "default" : tone;

	return (
		<Card className="shadow-sm transition-shadow duration-300 hover:shadow-md">
			<CardContent className="flex items-center gap-3 py-4">
				<span
					className={cn(
						"flex size-9 shrink-0 items-center justify-center rounded-lg",
						TONES[applied]
					)}
				>
					<Icon className="size-4" />
				</span>

				<div className="min-w-0">
					<p className="truncate text-muted-foreground text-xs">{label}</p>
					{value === undefined ? (
						<Skeleton className="mt-1 h-6 w-12" />
					) : (
						<p className="numeric font-semibold text-xl leading-tight tracking-tight">
							{value.toLocaleString()}
						</p>
					)}
					{hint ? <p className="truncate text-muted-foreground text-xs">{hint}</p> : null}
				</div>
			</CardContent>
		</Card>
	);
}
