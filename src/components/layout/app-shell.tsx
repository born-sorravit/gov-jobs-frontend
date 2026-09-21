"use client";

import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { SidebarNav } from "@/components/layout/sidebar-nav";
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
		<Link href="/" onClick={onNavigate} className="flex items-center gap-2.5">
			<span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
				<Landmark className="size-5" />
			</span>
			<span className="font-semibold text-base leading-tight tracking-tight">{t("name")}</span>
		</Link>
	);
}

/**
 * Sidebar on desktop, a sheet behind a hamburger below `lg`.
 *
 * The nav is duplicated rather than portalled between breakpoints: one `SidebarNav` moved
 * across containers would lose its state on every resize, and the component is cheap.
 */
export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const t = useTranslations("nav");

	return (
		<div className="flex min-h-svh flex-col lg:flex-row">
			<aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
				<div className="p-5">
					<Brand />
				</div>
				<div className="px-3">
					<SidebarNav />
				</div>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
					<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("menu")}>
								<Menu className="size-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-72 p-0">
							<SheetTitle className="sr-only">{t("menu")}</SheetTitle>
							<div className="p-5">
								<Brand onNavigate={() => setMenuOpen(false)} />
							</div>
							<div className="px-3">
								<SidebarNav onNavigate={() => setMenuOpen(false)} />
							</div>
						</SheetContent>
					</Sheet>

					<div className="lg:hidden">
						<Brand />
					</div>
					{title ? (
						<h1 className="hidden font-semibold text-lg tracking-tight lg:block">{title}</h1>
					) : null}

					<div className="ml-auto flex items-center gap-1">
						{/*
						 * LocaleSwitcher reads useSearchParams so it can carry the current filters
						 * across a language change. That opts its subtree out of static rendering,
						 * so it is isolated behind Suspense — the rest of the page still prerenders.
						 */}
						<Suspense fallback={<div className="size-9" />}>
							<LocaleSwitcher />
						</Suspense>
						<ThemeToggle />
					</div>
				</header>

				<main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
			</div>
		</div>
	);
}
