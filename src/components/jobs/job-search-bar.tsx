"use client";

import { MultiSelectFilter } from "@/components/jobs/multi-select-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { JobsQuery, ReferenceCatalog } from "@/types/api";
import { Banknote, Briefcase, MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface JobSearchBarProps {
	query: JobsQuery;
	reference?: ReferenceCatalog;
	onSubmit: (next: Partial<JobsQuery>) => void;
}

const SALARY_BANDS = [
	{ id: 1, min: undefined, max: 15_000 },
	{ id: 2, min: 15_000, max: 25_000 },
	{ id: 3, min: 25_000, max: 40_000 },
	{ id: 4, min: 40_000, max: undefined },
] as const;

/**
 * One segmented control: keyword · province · position type · salary · submit.
 *
 * Keyword is deliberately **not** applied as you type — it is committed on submit, so a
 * half-typed Thai word does not fire a request per keystroke. The selects apply immediately,
 * which is what a filter is expected to do.
 */
export function JobSearchBar({ query, reference, onSubmit }: JobSearchBarProps) {
	const t = useTranslations("common");
	const tJob = useTranslations("job");
	const tFilter = useTranslations("filters");
	const [keyword, setKeyword] = useState(query.q ?? "");
	const [syncedQ, setSyncedQ] = useState(query.q);

	// Re-sync the box when the query changes from somewhere else — the back button, or a
	// chip being cleared. Adjusting during render rather than in an effect avoids the extra
	// commit that would briefly show the stale value.
	if (query.q !== syncedQ) {
		setSyncedQ(query.q);
		setKeyword(query.q ?? "");
	}

	const activeBand = SALARY_BANDS.find(
		(band) => band.min === query.salaryMin && band.max === query.salaryMax
	);

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit({ q: keyword.trim() || undefined });
			}}
			className="rounded-xl border bg-card shadow-sm"
		>
			<div className="grid divide-y lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:divide-x lg:divide-y-0">
				<div className="flex items-center gap-2 px-4 py-3">
					<Search className="size-4 shrink-0 text-muted-foreground" />
					<Input
						value={keyword}
						onChange={(event) => setKeyword(event.target.value)}
						placeholder={tFilter("keywordPlaceholder")}
						aria-label={t("search")}
						className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
					/>
				</div>

				<MultiSelectFilter
					label={tJob("province")}
					icon={<MapPin className="size-4 shrink-0 text-muted-foreground" />}
					options={reference?.provinces ?? []}
					selected={query.province ?? []}
					onChange={(province) => onSubmit({ province: province.length ? province : undefined })}
					footer={
						<div className="flex items-start gap-3">
							<Switch
								id="province-strict"
								checked={query.provinceStrict ?? false}
								onCheckedChange={(checked) => onSubmit({ provinceStrict: checked || undefined })}
							/>
							<Label htmlFor="province-strict" className="cursor-pointer text-xs leading-snug">
								{tFilter("provinceStrict")}
								<span className="block font-normal text-muted-foreground">
									{tFilter("provinceStrictHint")}
								</span>
							</Label>
						</div>
					}
				/>

				<MultiSelectFilter
					label={tJob("jobType")}
					icon={<Briefcase className="size-4 shrink-0 text-muted-foreground" />}
					options={reference?.jobTypes ?? []}
					selected={query.jobType ?? []}
					onChange={(jobType) => onSubmit({ jobType: jobType.length ? jobType : undefined })}
				/>

				<div className="flex items-center gap-2 px-4 py-3">
					<Banknote className="size-4 shrink-0 text-muted-foreground" />
					<select
						value={activeBand?.id ?? ""}
						onChange={(event) => {
							const band = SALARY_BANDS.find((entry) => String(entry.id) === event.target.value);
							onSubmit({ salaryMin: band?.min, salaryMax: band?.max });
						}}
						aria-label={tJob("salary")}
						className="min-w-0 flex-1 truncate bg-transparent text-sm outline-none"
					>
						<option value="">{tFilter("anySalary")}</option>
						{SALARY_BANDS.map((band) => (
							<option key={band.id} value={band.id}>
								{tFilter(`salaryBand${band.id}` as "salaryBand1")}
							</option>
						))}
					</select>
				</div>

				<div className="p-2 lg:p-2">
					<Button type="submit" className="h-full w-full gap-2 px-6">
						<Search className="size-4" />
						{t("search")}
					</Button>
				</div>
			</div>
		</form>
	);
}
