"use client";

import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { useSavedJobIds, useToggleSavedJob } from "@/hooks/use-saved-jobs";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface SaveJobButtonProps {
	jobId: string;
	/** `icon` sits on a card; `full` is the wide button on the detail page. */
	variant?: "icon" | "full";
	className?: string;
}

export function SaveJobButton({ jobId, variant = "icon", className }: SaveJobButtonProps) {
	const t = useTranslations("job");
	const tErrors = useTranslations("errors");
	const { user } = useSession();
	const { ids } = useSavedJobIds();
	const toggle = useToggleSavedJob();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const saved = ids.has(jobId);
	const label = saved ? t("savedJob") : t("saveJob");

	const onClick = () => {
		// Signed out: send them to sign in and bring them back to this exact page, filters
		// and all, rather than silently doing nothing.
		if (!user) {
			const query = searchParams.toString();
			const next = `${pathname}${query ? `?${query}` : ""}`;
			router.push(`/login?next=${encodeURIComponent(next)}`);
			return;
		}

		toggle.mutate(
			{ jobId, saved },
			{ onError: () => toast.error(tErrors("generic")) }
		);
	};

	if (variant === "full") {
		return (
			<Button
				type="button"
				variant={saved ? "secondary" : "outline"}
				onClick={onClick}
				className={cn("w-full", className)}
			>
				{saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
				{label}
			</Button>
		);
	}

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			aria-label={label}
			aria-pressed={saved}
			title={label}
			onClick={(event) => {
				// The whole card is a link; saving must not navigate.
				event.preventDefault();
				event.stopPropagation();
				onClick();
			}}
			className={cn("relative z-10 shrink-0", saved && "text-primary", className)}
		>
			{saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
		</Button>
	);
}
