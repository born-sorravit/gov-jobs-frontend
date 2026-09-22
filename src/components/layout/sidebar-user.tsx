"use client";

import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { LogOut, MoreVertical, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * The account, at the foot of the sidebar.
 *
 * Who you are signed in as belongs where it is always visible, not behind an avatar in a
 * corner of the header — which is also why the header's copy of this menu is hidden once the
 * sidebar is on screen.
 *
 * Signed out there is no identity to keep visible, only two calls to action, and a filled
 * primary button parked full-width in the bottom-left corner competes with whatever the page
 * itself is asking the reader to do. So that pair hides from `lg` up and the header shows it
 * instead. Below `lg` this component only ever renders inside the menu sheet, where the
 * header is not an option because the sheet is covering it.
 *
 * The divider travels with the content rather than sitting in the parent: left behind, it
 * would draw a hairline across an empty foot on every desktop page a signed-out reader opens.
 */
export function SidebarUser({ onNavigate }: { onNavigate?: () => void }) {
	const { user, isLoading, signOut } = useSession();
	const t = useTranslations("auth");
	const router = useRouter();

	// Only while a stale session is being rotated. A signed-out visitor is not "loading".
	if (isLoading) {
		return (
			<div className="border-t p-3">
				<Skeleton className="h-14 w-full rounded-xl" />
			</div>
		);
	}

	if (!user) {
		return (
			<div className="grid gap-2 border-t p-3 lg:hidden">
				<Button asChild variant="outline" size="sm" onClick={onNavigate}>
					<Link href="/login">{t("signIn")}</Link>
				</Button>
				<Button asChild size="sm" onClick={onNavigate}>
					<Link href="/register">{t("createAccount")}</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="border-t p-3">
			<div className="flex items-center gap-3 rounded-xl border bg-card/60 p-2.5 transition-colors hover:bg-card">
				<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 font-medium text-primary-foreground text-sm shadow-sm ring-1 ring-primary/20">
					{user.name.trim().charAt(0).toUpperCase() || "?"}
				</span>

				<div className="min-w-0 flex-1">
					<p className="truncate font-medium text-sm leading-tight">{user.name}</p>
					<p className="truncate text-muted-foreground text-xs">{user.email}</p>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-7 shrink-0"
							aria-label={t("account")}
						>
							<MoreVertical className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" side="top" className="w-52">
						<DropdownMenuItem asChild onClick={onNavigate}>
							<Link href="/account">
								<UserRound className="size-4" />
								{t("account")}
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={async () => {
								await signOut();
								onNavigate?.();
								// The server rendered this page knowing who was signed in, so the cached
								// markup has to be discarded rather than just the client state.
								router.refresh();
							}}
						>
							<LogOut className="size-4" />
							{t("signOut")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
