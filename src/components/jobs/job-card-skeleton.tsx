import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors JobCard's block structure so the grid does not reflow when data arrives. */
export function JobCardSkeleton() {
	return (
		<Card className="h-full gap-0 overflow-hidden py-0">
			<CardContent className="flex h-full flex-col gap-4 p-5">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-4 w-11/12" />
						<Skeleton className="h-4 w-7/12" />
					</div>
					<Skeleton className="h-5 w-20 rounded-full" />
				</div>
				<div className="space-y-1.5">
					<Skeleton className="h-3.5 w-3/4" />
					<Skeleton className="h-3 w-1/2" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-3.5 w-1/3" />
					<Skeleton className="h-3.5 w-2/3" />
					<Skeleton className="h-3.5 w-2/5" />
				</div>
				<div className="mt-auto flex items-center justify-between border-t pt-3">
					<Skeleton className="h-3 w-24" />
					<Skeleton className="h-3 w-16" />
				</div>
			</CardContent>
		</Card>
	);
}

export function JobGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{Array.from({ length: count }, (_, index) => (
				<JobCardSkeleton key={index} />
			))}
		</div>
	);
}
