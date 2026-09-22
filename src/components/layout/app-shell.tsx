"use client";

import { AccountMenu } from "@/components/layout/account-menu";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarSearch } from "@/components/layout/sidebar-search";
import { SidebarUser } from "@/components/layout/sidebar-user";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { Landmark, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, Suspense, useState } from "react";

function Brand({ onNavigate }: { onNavigate?: () => void }) {
	const t = useTranslations("app");

	return (
		<Link href="/" onClick={onNavigate} className="group flex items-center gap-2.5">
			<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-105">
				<Landmark className="size-5" />
			</span>
			<span className="min-w-0 truncate font-semibold text-base leading-tight tracking-tight">
				{t("name")}
			</span>
		</Link>
	);
}

/**
 * Brand, search, navigation, account — in that order, top to bottom.
 *
 * One component for both the desktop rail and the mobile sheet. The two used to be written
 * out twice, which is how they drift: a link added to one and forgotten in the other.
 * `onNavigate` is what the sheet passes to close itself; the rail passes nothing.
 */
function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="p-4">
				<Brand onNavigate={onNavigate} />
			</div>

			<div className="px-3 pb-3">
				<SidebarSearch onNavigate={onNavigate} />
			</div>

			{/* The nav scrolls on its own so the account card below never leaves the screen. */}
			<div className="min-h-0 flex-1 overflow-y-auto px-3">
				<SidebarNav onNavigate={onNavigate} />
			</div>

			{/* No wrapper: `SidebarUser` brings its own divider, because signed out on desktop it
			    renders nothing at all and a border left here would outline the emptiness. */}
			<SidebarUser onNavigate={onNavigate} />
		</div>
	);
}

/** Sidebar on desktop, a sheet behind a hamburger below `lg`. */
export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const t = useTranslations("nav");

	return (
		<div className="flex min-h-svh flex-col lg:flex-row">
			<aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:block">
				<div className="sticky top-0 h-svh">
					<SidebarBody />
				</div>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/75 px-4 py-3 backdrop-blur-xl lg:px-8">
					<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("menu")}>
								<Menu className="size-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-72 bg-sidebar p-0">
							<SheetTitle className="sr-only">{t("menu")}</SheetTitle>
							<SidebarBody onNavigate={() => setMenuOpen(false)} />
						</SheetContent>
					</Sheet>

					{/* min-w-0 so the name truncates instead of pushing the controls off-screen. */}
					<div className="min-w-0 lg:hidden">
						<Brand />
					</div>
					{/*
					 * Deliberately not an `h1`. This repeats the page's own heading as a toolbar
					 * label and is `hidden` below `lg` — as a heading it gave every page two `h1`s
					 * on desktop and none at all on mobile, where the real heading is an `h2`.
					 * Each page owns its `h1` now; this is just chrome.
					 */}
					{title ? (
						<p className="hidden font-semibold text-lg tracking-tight lg:block">{title}</p>
					) : null}

					<div className="ml-auto flex shrink-0 items-center gap-1">
						{/*
						 * LocaleSwitcher reads useSearchParams so it can carry the current filters
						 * across a language change. That opts its subtree out of static rendering,
						 * so it is isolated behind Suspense — the rest of the page still prerenders.
						 */}
						<Suspense fallback={<div className="size-9" />}>
							<LocaleSwitcher />
						</Suspense>
						<ThemeToggle />
						{/*
						 * The two halves of this split live in `AccountMenu` itself, which is the only
						 * thing that knows whether anyone is signed in: signed in, the sidebar owns the
						 * account and this hides from `lg` up; signed out, this is the only copy at any
						 * width.
						 */}
						<AccountMenu />
					</div>
				</header>

				<main className="flex-1 px-4 py-6 lg:px-8 lg:py-10">{children}</main>
			</div>
		</div>
	);
}
