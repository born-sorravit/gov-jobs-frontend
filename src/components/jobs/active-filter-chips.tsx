"use client";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { referenceLabel } from "@/lib/format";
import { findSalaryBand } from "@/lib/jobs-query";
import type { JobsQuery, ReferenceCatalog, ReferenceOption } from "@/types/api";
import {
	Banknote,
	Briefcase,
	CircleDot,
	Crosshair,
	GraduationCap,
	Layers,
	MapPin,
	Search,
	X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface Chip {
	key: string;
	/** The icon of the control that set this filter, so a chip says which one to go back to. */
	icon: LucideIcon;
	label: string;
	clear: Partial<JobsQuery>;
}

/**
 * Every applied filter, individually removable.
 *
 * Without this a user who filtered inside three popovers has no single place that shows what
 * is actually narrowing the list, and "no results" becomes a mystery.
 */
export function ActiveFilterChips({
	query,
	reference,
	onChange,
	onClearAll,
}: {
	query: JobsQuery;
	reference?: ReferenceCatalog;
	onChange: (next: Partial<JobsQuery>) => void;
	onClearAll: () => void;
}) {
	const locale = useLocale() as Locale;
	const t = useTranslations("common");
	const tStatus = useTranslations("jobStatus");
	const tFilter = useTranslations("filters");

	const chips: Chip[] = [];

	if (query.q) {
		chips.push({ key: "q", icon: Search, label: `"${query.q}"`, clear: { q: undefined } });
	}

	const idChips = (
		field: "province" | "jobType" | "jobCategory" | "education",
		icon: LucideIcon,
		options: ReferenceOption[] | undefined
	) => {
		for (const id of query[field] ?? []) {
			chips.push({
				key: `${field}-${id}`,
				icon,
				label: referenceLabel(options?.find((option) => option.id === id), locale),
				clear: {
					[field]: (query[field] ?? []).filter((entry) => entry !== id) || undefined,
				} as Partial<JobsQuery>,
			});
		}
	};

	idChips("province", MapPin, reference?.provinces);
	idChips("jobType", Briefcase, reference?.jobTypes);
	idChips("jobCategory", Layers, reference?.jobCategories);
	idChips("education", GraduationCap, reference?.educationLevels);

	if (query.provinceStrict) {
		chips.push({
			key: "provinceStrict",
			icon: Crosshair,
			label: tFilter("provinceStrict"),
			clear: { provinceStrict: undefined },
		});
	}

	if (query.status) {
		chips.push({
			key: "status",
			icon: CircleDot,
			label: tStatus(query.status),
			clear: { status: undefined },
		});
	}

	if (query.salaryMin !== undefined || query.salaryMax !== undefined) {
		/*
		 * Name the band the reader picked. Printing the bounds instead produced "เงินเดือน: ––15,000"
		 * for the open-ended first band — a placeholder dash for the missing minimum, immediately
		 * followed by the separator dash. The band's own label already reads "ไม่เกิน 15,000".
		 */
		const band = findSalaryBand(query.salaryMin, query.salaryMax);
		const min = query.salaryMin?.toLocaleString();
		const max = query.salaryMax?.toLocaleString();

		/*
		 * A hand-edited URL can carry bounds no band covers. Naming the open end matters:
		 * printing the bare figure made `salaryMin=17000` and `salaryMax=33000` — opposite
		 * filters — both read "17,000"/"33,000" with nothing to tell them apart.
		 *
		 * Written as a chain rather than a nested ternary with a cast: each branch narrows
		 * `min`/`max` on its own, so the "both undefined" case falls through to null and is
		 * simply not rendered, instead of being asserted away as a string it might not be.
		 */
		const custom =
			min && max
				? `${min}–${max}`
				: max
					? tFilter("salaryUpTo", { value: max })
					: min
						? tFilter("salaryFrom", { value: min })
						: null;

		const label = band ? tFilter(`salaryBand${band.id}` as "salaryBand1") : custom;

		if (label) {
			chips.push({
				key: "salary",
				icon: Banknote,
				label,
				clear: { salaryMin: undefined, salaryMax: undefined },
			});
		}
	}

	if (chips.length === 0) return null;

	return (
		<div className="flex flex-wrap items-center gap-2">
			{chips.map((chip) => {
				const Icon = chip.icon;

				return (
					/*
					 * A plain element wrapping one button, not a clickable pill: the chip reports a
					 * value, and only the × acts. Making the whole thing clickable would leave no way
					 * to tell "remove this" from "edit this".
					 */
					<span
						key={chip.key}
						className="inline-flex h-8 min-w-0 max-w-full items-center gap-1.5 rounded-full border bg-secondary/70 py-1 pr-1 pl-3 text-sm transition-colors hover:bg-secondary [@media(pointer:coarse)]:h-10"
					>
						<Icon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
						{/*
						 * `min-w-0` + `truncate` keeps a long province or category on one line and lets
						 * it shrink instead of wrapping the chip to a second row. The untruncated value
						 * stays reachable: it is in the button's `aria-label` for assistive tech and in
						 * `title` for a pointer, so recovery is never hover-only for keyboard users.
						 */}
						<span className="min-w-0 truncate" title={chip.label}>
							{chip.label}
						</span>
						<button
							type="button"
							onClick={() => onChange(chip.clear)}
							aria-label={`${t("clear")}: ${chip.label}`}
							/*
							 * 24px on a mouse, 32px under a finger. The 44px touch minimum cannot be met
							 * here without the hit area spilling onto the neighbouring chip — they sit
							 * 8px apart — so the row grows on coarse pointers instead, which buys the
							 * height honestly rather than overlapping a target that deletes a different
							 * filter.
							 */
							className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1 [@media(pointer:coarse)]:size-8"
						>
							<X className="size-3.5" />
						</button>
					</span>
				);
			})}

			{/*
			 * Set apart by a rule rather than sitting flush against the chips: it clears all of
			 * them at once, so reading as one more chip in the row is exactly wrong.
			 */}
			<span aria-hidden className="mx-1 h-5 w-px bg-border" />
			<Button variant="ghost" size="sm" onClick={onClearAll} className="h-8 text-muted-foreground text-xs hover:text-foreground [@media(pointer:coarse)]:h-10">
				{t("clearAll")}
			</Button>
		</div>
	);
}
