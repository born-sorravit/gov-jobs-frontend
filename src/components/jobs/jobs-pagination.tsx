"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/types/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The page numbers to render, with `null` standing for a gap.
 *
 * The first and last page are always present so the ends of the range stay reachable in one
 * click; the middle is a window around the current page. 40 pages therefore render as
 * `1 … 18 19 20 21 22 … 40` rather than wrapping onto a second line.
 */
const windowed = (page: number, lastPage: number): (number | null)[] => {
	if (lastPage <= 7) return Array.from({ length: lastPage }, (_, index) => index + 1);

	const around = [page - 1, page, page + 1].filter((n) => n > 1 && n < lastPage);
	const pages = [1, ...around, lastPage];

	const withGaps: (number | null)[] = [];
	for (const [index, value] of pages.entries()) {
		const previous = pages[index - 1];
		if (previous !== undefined && value - previous > 1) withGaps.push(null);
		withGaps.push(value);
	}
	return withGaps;
};

export function JobsPagination({
	meta,
	onPageChange,
}: {
	meta: PaginationMeta;
	onPageChange: (page: number) => void;
}) {
	const t = useTranslations("common");

	if (meta.last_page <= 1) return null;

	const first = meta.page <= 1;
	const last = meta.page >= meta.last_page;

	return (
		<nav
			aria-label={t("pageOf", { page: meta.page, total: meta.last_page })}
			className="flex items-center justify-between gap-3 pt-2"
		>
			<Button
				variant="outline"
				size="icon"
				disabled={first}
				aria-label={t("previousPage")}
				onClick={() => onPageChange(meta.page - 1)}
				className="size-9 shrink-0 rounded-full"
			>
				<ChevronLeft className="size-4" />
			</Button>

			{/* Numbers need room; below `sm` a plain "page 3 of 12" is more useful than a scroll. */}
			<span className="numeric text-muted-foreground text-sm sm:hidden">
				{t("pageOf", { page: meta.page, total: meta.last_page })}
			</span>

			<div className="hidden items-center gap-1 sm:flex">
				{windowed(meta.page, meta.last_page).map((page, index) =>
					page === null ? (
						<span
							// Gaps have no identity of their own; their position is the only key available.
							key={`gap-${index}`}
							aria-hidden
							className="px-1 text-muted-foreground text-sm"
						>
							…
						</span>
					) : (
						<button
							key={page}
							type="button"
							aria-current={page === meta.page ? "page" : undefined}
							onClick={() => onPageChange(page)}
							className={cn(
								"numeric size-9 rounded-full font-medium text-sm transition-colors",
								page === meta.page
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
							)}
						>
							{page}
						</button>
					)
				)}
			</div>

			<Button
				variant="outline"
				size="icon"
				disabled={last}
				aria-label={t("nextPage")}
				onClick={() => onPageChange(meta.page + 1)}
				className="size-9 shrink-0 rounded-full"
			>
				<ChevronRight className="size-4" />
			</Button>
		</nav>
	);
}
