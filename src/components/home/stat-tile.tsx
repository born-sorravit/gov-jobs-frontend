"use client";

import { CountUp } from "@/components/motion/count-up";
import { trackSpotlight } from "@/components/motion/spotlight";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

/**
 * One figure from the hero panel.
 *
 * A client component only so the pointer can be tracked for `.spotlight-border`; everything
 * it renders is static.
 *
 * A tile rather than a row in a list: figure and label sit together behind a coloured chip,
 * with the chevron making the obvious thing true — every figure is a way into the search that
 * produced it. Pushed to opposite ends of the panel, as they were, a number and what it
 * counted read as a table missing its leader dots.
 */
export function StatTile({
	value,
	label,
	icon,
	href,
	tint,
	locale,
}: {
	value: number;
	label: string;
	icon: React.ReactNode;
	href: string;
	tint: string;
	locale: Locale;
}) {
	return (
		<Link
			href={href}
			onPointerMove={trackSpotlight}
			className={cn(
				"spotlight-border group/stat flex items-center gap-3.5 rounded-2xl border bg-card/55 px-3.5 py-3",
				"transition-colors hover:bg-card focus-visible:border-primary/40 focus-visible:outline-none",
			)}
		>
			<span
				className="icon-tile flex size-11 shrink-0 items-center justify-center rounded-xl"
				style={{ "--tile": tint } as React.CSSProperties}
			>
				{icon}
			</span>
			<span className="h-9 w-px shrink-0 bg-border" />
			<span className="min-w-0 flex-1 leading-tight">
				<CountUp
					value={value}
					locale={locale}
					className="numeric block font-semibold text-3xl tracking-tight"
				/>
				<span className="mt-0.5 block text-muted-foreground text-xs">{label}</span>
			</span>
			<ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-all group-hover/stat:translate-x-0.5 group-hover/stat:text-foreground" />
		</Link>
	);
}
