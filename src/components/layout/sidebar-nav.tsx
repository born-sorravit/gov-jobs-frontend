"use client";

import { useSession } from "@/components/providers/session-provider";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Bell, Bookmark, Briefcase, Home, LayoutDashboard, ShieldCheck } from "lucide-react";
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
		<nav className="grid gap-1">
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
							"flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-colors",
							active
								? "bg-primary text-primary-foreground shadow-sm"
								: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
						)}
					>
						<Icon className="size-4 shrink-0" />
						{t(key)}
					</Link>
				);
			})}
		</nav>
	);
}
