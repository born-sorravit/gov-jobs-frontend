"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

/**
 * A segmented control: one track, one highlight that slides between options.
 *
 * Replaces a row of outlined buttons where exactly one was "secondary". Four separate pills
 * do not say "pick one of these" — a single track with a moving indicator does, and the
 * movement makes the change legible without reading the labels again.
 *
 * `layoutId` is what makes the highlight travel rather than cross-fade. Under
 * `MotionConfig reducedMotion="user"` it snaps instead, which is the point.
 */
export function Segmented<T extends string>({
	options,
	value,
	onChange,
	label,
}: {
	options: { value: T; label: string }[];
	value: T;
	onChange: (value: T) => void;
	label: string;
}) {
	return (
		<div
			role="tablist"
			aria-label={label}
			className="inline-flex items-center gap-0.5 rounded-xl bg-muted p-1"
		>
			{options.map((option) => {
				const active = option.value === value;

				return (
					<button
						key={option.value}
						type="button"
						role="tab"
						aria-selected={active}
						onClick={() => onChange(option.value)}
						className={cn(
							"relative rounded-lg px-3.5 py-1.5 font-medium text-sm transition-colors duration-200",
							active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
						)}
					>
						{active ? (
							<motion.span
								layoutId={`segmented-${label}`}
								aria-hidden
								className="absolute inset-0 rounded-lg bg-card shadow-sm ring-1 ring-border/60"
								transition={{ type: "spring", stiffness: 420, damping: 34 }}
							/>
						) : null}
						<span className="relative whitespace-nowrap">{option.label}</span>
					</button>
				);
			})}
		</div>
	);
}
