"use client";

import { SearchField } from "@/components/common/search-field";
import { MultiSelectFilter } from "@/components/jobs/multi-select-filter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SALARY_BANDS, findSalaryBand } from "@/lib/jobs-query";
import { cn } from "@/lib/utils";
import type { JobsQuery, ReferenceCatalog } from "@/types/api";
import { AnimatePresence, motion } from "motion/react";
import {
  Banknote,
  Briefcase,
  ChevronDown,
  GraduationCap,
  MapPin,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface JobSearchBarProps {
  query: JobsQuery;
  reference?: ReferenceCatalog;
  onSubmit: (next: Partial<JobsQuery>) => void;
}

/** Every control sits under its own label, so none of them is a mystery icon. */
function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <Label
        htmlFor={htmlFor}
        className="font-medium text-muted-foreground text-xs"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

/**
 * The shared shell so a select and a popover trigger look like the same control — and like the
 * search field beside them.
 *
 * Deliberately the same recipe as `Input`, which is what `SearchField` renders: `border-input`
 * over `bg-background`, lifted to a translucent fill in dark mode, with `ring-3` on focus. The
 * previous hand-rolled `border bg-background` differed from it in border opacity, fill and
 * focus ring, which is why one row could contain two controls that were subtly not the same
 * thing. `focus-within` rather than `focus-visible` because the focus lands on a child.
 */
const CONTROL =
  "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30";

/**
 * Keyword · province · position type, then everything else behind a toggle.
 *
 * Keyword is deliberately **not** applied as you type — it is committed on submit, so a
 * half-typed Thai word does not fire a request per keystroke. The selects apply immediately,
 * which is what a filter is expected to do.
 *
 * The advanced row starts open when it already holds a filter, so a shared URL never hides
 * the reason its results look the way they do.
 */
export function JobSearchBar({
  query,
  reference,
  onSubmit,
}: JobSearchBarProps) {
  const t = useTranslations("common");
  const tJob = useTranslations("job");
  const tFilter = useTranslations("filters");
  const [keyword, setKeyword] = useState(query.q ?? "");
  const [syncedQ, setSyncedQ] = useState(query.q);

  const advancedInUse =
    (query.education?.length ?? 0) > 0 ||
    query.salaryMin !== undefined ||
    query.salaryMax !== undefined ||
    Boolean(query.provinceStrict);
  const [expanded, setExpanded] = useState(advancedInUse);

  // Re-sync the box when the query changes from somewhere else — the back button, or a
  // chip being cleared. Adjusting during render rather than in an effect avoids the extra
  // commit that would briefly show the stale value.
  if (query.q !== syncedQ) {
    setSyncedQ(query.q);
    setKeyword(query.q ?? "");
  }

  const activeBand = findSalaryBand(query.salaryMin, query.salaryMax);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ q: keyword.trim() || undefined });
      }}
      className="rounded-2xl border bg-card p-4 shadow-sm lg:p-5"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <Field label={tFilter("searchLabel")} htmlFor="jobs-keyword">
          {/* `h-10` so it lines up with the selects beside it; everything else about the
              control is whatever the sidebar search is. */}
          <SearchField
            id="jobs-keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={tFilter("keywordPlaceholder")}
            className="h-10"
          />
        </Field>

        <Field label={tJob("province")}>
          <MultiSelectFilter
            className={CONTROL}
            label={tJob("province")}
            icon={<MapPin className="size-4 shrink-0 text-muted-foreground" />}
            options={reference?.provinces ?? []}
            selected={query.province ?? []}
            onChange={(province) =>
              onSubmit({ province: province.length ? province : undefined })
            }
          />
        </Field>

        <Field label={tJob("jobType")}>
          <MultiSelectFilter
            className={CONTROL}
            label={tJob("jobType")}
            icon={
              <Briefcase className="size-4 shrink-0 text-muted-foreground" />
            }
            options={reference?.jobTypes ?? []}
            selected={query.jobType ?? []}
            onChange={(jobType) =>
              onSubmit({ jobType: jobType.length ? jobType : undefined })
            }
          />
        </Field>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls="jobs-advanced-filters"
            aria-label={
              expanded ? tFilter("fewerFilters") : tFilter("moreFilters")
            }
            className="size-10 shrink-0 rounded-full"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-300",
                expanded && "rotate-180",
              )}
            />
          </Button>
          <Button type="submit" className="h-10 flex-1 gap-2 px-6 lg:flex-none">
            <Search className="size-4" />
            {t("search")}
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            id="jobs-advanced-filters"
            key="advanced"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid gap-4 border-t pt-4 lg:grid-cols-3 lg:items-end">
              <Field label={tJob("education")}>
                <MultiSelectFilter
                  className={CONTROL}
                  label={tJob("education")}
                  icon={
                    <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
                  }
                  options={reference?.educationLevels ?? []}
                  selected={query.education ?? []}
                  onChange={(education) =>
                    onSubmit({
                      education: education.length ? education : undefined,
                    })
                  }
                />
              </Field>

              <Field label={tJob("salary")} htmlFor="jobs-salary">
                <div className={CONTROL}>
                  <Banknote className="size-4 shrink-0 text-muted-foreground" />
                  <select
                    id="jobs-salary"
                    value={activeBand?.id ?? ""}
                    onChange={(event) => {
                      const band = SALARY_BANDS.find(
                        (entry) => String(entry.id) === event.target.value,
                      );
                      onSubmit({ salaryMin: band?.min, salaryMax: band?.max });
                    }}
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
              </Field>

              {/* Not a filter of its own — it changes what the province filter means. */}
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
                <Switch
                  id="province-strict"
                  checked={query.provinceStrict ?? false}
                  onCheckedChange={(checked) =>
                    onSubmit({ provinceStrict: checked || undefined })
                  }
                />
                {/* `Label` lays its children out in a row, so the hint needs its own block to
								    sit under the title rather than beside it. */}
                <Label
                  htmlFor="province-strict"
                  className="min-w-0 cursor-pointer"
                >
                  <span className="block space-y-0.5 text-xs leading-snug">
                    <span className="block font-medium">
                      {tFilter("provinceStrict")}
                    </span>
                    <span className="block font-normal text-muted-foreground">
                      {tFilter("provinceStrictHint")}
                    </span>
                  </span>
                </Label>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
