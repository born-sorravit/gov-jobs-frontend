"use client";

import type { CrawlerRun } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * The last N crawls as one bar each, newest on the right.
 *
 * The table below already lists every run, but a table answers "what happened at 11:55",
 * not "is this thing healthy". A row of bars answers the second question before you have
 * read anything — one red bar among twenty is a blip, five in a row is an outage.
 *
 * Deliberately *not* a bar chart. An earlier version scaled height by how much each run
 * found, which sounds informative and is not: every successful crawl of this source returns
 * within a couple of announcements of every other, so the bars came out identical and the
 * height encoded nothing while implying it did. Status is the signal; the exact numbers are
 * one hover away.
 */
const STATUS_CLASS: Record<CrawlerRun["status"], string> = {
	SUCCESS: "bg-emerald-500/70 hover:bg-emerald-500",
	FAILED: "bg-destructive/80 hover:bg-destructive",
	RUNNING: "bg-muted-foreground/40 hover:bg-muted-foreground/60",
};

export function RunHistoryStrip({
	runs,
	label,
}: {
	runs: CrawlerRun[];
	label: (run: CrawlerRun) => string;
}) {
	if (runs.length === 0) return null;

	// Oldest first, so time runs left to right the way a chart is read.
	const ordered = [...runs].reverse();

	return (
		// Radix's Tooltip.Root throws outside a Provider, and this is the only place on the
		// page that uses one.
		<TooltipProvider delayDuration={120}>
			{/* Right-aligned: the strip is a timeline ending at "now", so a short history leaves
			    the gap on the old end rather than stretching the bars to fill it. */}
			<div className="flex h-10 items-stretch justify-end gap-1.5">
				{ordered.map((run) => (
					<Tooltip key={run.id}>
						<TooltipTrigger asChild>
							<span
								className={cn(
									"w-3 shrink-0 cursor-default rounded-full transition-colors",
									STATUS_CLASS[run.status]
								)}
							/>
						</TooltipTrigger>
						<TooltipContent side="top">{label(run)}</TooltipContent>
					</Tooltip>
				))}
			</div>
		</TooltipProvider>
	);
}
