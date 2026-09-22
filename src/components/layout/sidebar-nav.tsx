"use client";

import { useSession } from "@/components/providers/session-provider";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Bell, Bookmark, Briefcase, Home, LayoutDashboard, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

const ITEMS = [
	{ href: "/", key: "home", icon: Home },
	{ href: "/jobs", key: "jobs", icon: Briefcase },
	{ href: "/saved", key: "saved", icon: Bookmark },
	{ href: "/alerts", key: "alerts", icon: Bell },
	{ href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
] as const;

/** Shown only to an admin. The page enforces this too; this just avoids a dead link. */
const ADMIN_ITEM = { href: "/admin", key: "admin", icon: ShieldCheck } as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
	const t = useTranslations("nav");
	const pathname = usePathname();
	const { user } = useSession();

	const items = user?.role === "ADMIN" ? [...ITEMS, ADMIN_ITEM] : ITEMS;

	return (
		<nav className="grid gap-0.5">
			{items.map(({ href, key, icon: Icon }) => {
				// `/` must match exactly or it would light up on every page.
				const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

				return (
					<Link
						key={key}
						href={href}
						onClick={onNavigate}
						aria-current={active ? "page" : undefined}
						className={cn(
							"group relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-colors duration-200",
							active
								? "text-foreground"
								: "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
						)}
					>
						{/*
						 * One shared element across every item, so moving between pages slides the
						 * highlight rather than cross-fading two of them. It sits behind the label
						 * and is inert to the pointer.
						 */}
						{active ? (
							<motion.span
								layoutId="sidebar-active"
								aria-hidden
								className="absolute inset-0 rounded-lg bg-accent"
								transition={{ type: "spring", stiffness: 420, damping: 34 }}
							/>
						) : null}

						{/* The rail reads as "you are here" at a glance, even in peripheral vision. */}
						{active ? (
							<span
								aria-hidden
								className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-primary"
							/>
						) : null}

						<Icon
							className={cn(
								"relative size-4 shrink-0 transition-colors",
								active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
							)}
						/>
						<span className="relative">{t(key)}</span>
					</Link>
				);
			})}
		</nav>
	);
}
