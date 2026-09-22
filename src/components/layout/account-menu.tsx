"use client";

import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { LogOut, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

export function AccountMenu() {
	const { user, isLoading, signOut } = useSession();
	const t = useTranslations("auth");
	const router = useRouter();

	// Only while a stale session is being rotated. A signed-out visitor is not "loading".
	if (isLoading) {
		return <Skeleton className="h-9 w-9 rounded-md" />;
	}

	if (!user) {
		return (
			<div className="flex items-center gap-1">
				<Button asChild variant="ghost" size="sm">
					<Link href="/login">{t("signIn")}</Link>
				</Button>
				<Button asChild size="sm" className="hidden sm:inline-flex">
					<Link href="/register">{t("createAccount")}</Link>
				</Button>
			</div>
		);
	}

	const initial = user.name.trim().charAt(0).toUpperCase() || "?";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" aria-label={t("account")}>
					<span className="flex size-7 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
						{initial}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<p className="truncate font-medium text-sm">{user.name}</p>
					<p className="truncate text-muted-foreground text-xs">{user.email}</p>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/account">
						<UserRound className="size-4" />
						{t("account")}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={async () => {
						await signOut();
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
	);
}
