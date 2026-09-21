"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { referenceLabel } from "@/lib/format";
import type { JobsQuery, ReferenceCatalog, ReferenceOption } from "@/types/api";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface Chip {
	key: string;
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
	const tJob = useTranslations("job");
	const tStatus = useTranslations("jobStatus");
	const tFilter = useTranslations("filters");

	const chips: Chip[] = [];

	if (query.q) {
		chips.push({ key: "q", label: `"${query.q}"`, clear: { q: undefined } });
	}

	const idChips = (
		field: "province" | "jobType" | "jobCategory" | "education",
		options: ReferenceOption[] | undefined
	) => {
		for (const id of query[field] ?? []) {
			chips.push({
				key: `${field}-${id}`,
				label: referenceLabel(options?.find((option) => option.id === id), locale),
				clear: {
					[field]: (query[field] ?? []).filter((entry) => entry !== id) || undefined,
				} as Partial<JobsQuery>,
			});
		}
	};

	idChips("province", reference?.provinces);
	idChips("jobType", reference?.jobTypes);
	idChips("jobCategory", reference?.jobCategories);
	idChips("education", reference?.educationLevels);

	if (query.provinceStrict) {
		chips.push({
			key: "provinceStrict",
			label: tFilter("provinceStrict"),
			clear: { provinceStrict: undefined },
		});
	}

	if (query.status) {
		chips.push({ key: "status", label: tStatus(query.status), clear: { status: undefined } });
	}

	if (query.salaryMin !== undefined || query.salaryMax !== undefined) {
		const min = query.salaryMin?.toLocaleString();
		const max = query.salaryMax?.toLocaleString();
		chips.push({
			key: "salary",
			label: `${tJob("salary")}: ${min ?? "–"}–${max ?? "–"}`,
			clear: { salaryMin: undefined, salaryMax: undefined },
		});
	}

	if (chips.length === 0) return null;

	return (
		<div className="flex flex-wrap items-center gap-2">
			{chips.map((chip) => (
				<Badge key={chip.key} variant="secondary" className="gap-1 py-1 pr-1 pl-2.5 font-normal">
					<span className="max-w-48 truncate">{chip.label}</span>
					<button
						type="button"
						onClick={() => onChange(chip.clear)}
						aria-label={`${t("clear")}: ${chip.label}`}
						className="rounded-full p-0.5 hover:bg-background/70"
					>
						<X className="size-3" />
					</button>
				</Badge>
			))}

			<Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 text-xs">
				{t("clearAll")}
			</Button>
		</div>
	);
}
