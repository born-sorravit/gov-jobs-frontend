"use client";

import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import type { PaginationMeta } from "@/types/api";

/** Up to 5 numbered pages centred on the current one, so 40 pages do not wrap the row. */
const windowed = (page: number, lastPage: number): number[] => {
	const size = Math.min(5, lastPage);
	let start = Math.max(1, page - Math.floor(size / 2));
	if (start + size - 1 > lastPage) start = lastPage - size + 1;
	return Array.from({ length: size }, (_, index) => start + index);
};

export function JobsPagination({
	meta,
	onPageChange,
}: {
	meta: PaginationMeta;
	onPageChange: (page: number) => void;
}) {
	if (meta.last_page <= 1) return null;

	const pages = windowed(meta.page, meta.last_page);

	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						href="#"
						aria-disabled={meta.page <= 1}
						className={meta.page <= 1 ? "pointer-events-none opacity-50" : undefined}
						onClick={(event) => {
							event.preventDefault();
							if (meta.page > 1) onPageChange(meta.page - 1);
						}}
					/>
				</PaginationItem>

				{pages.map((page) => (
					<PaginationItem key={page}>
						<PaginationLink
							href="#"
							isActive={page === meta.page}
							onClick={(event) => {
								event.preventDefault();
								onPageChange(page);
							}}
						>
							{page}
						</PaginationLink>
					</PaginationItem>
				))}

				<PaginationItem>
					<PaginationNext
						href="#"
						aria-disabled={meta.page >= meta.last_page}
						className={
							meta.page >= meta.last_page ? "pointer-events-none opacity-50" : undefined
						}
						onClick={(event) => {
							event.preventDefault();
							if (meta.page < meta.last_page) onPageChange(meta.page + 1);
						}}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
