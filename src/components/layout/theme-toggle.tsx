"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const t = useTranslations("common");

	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label={t("theme")}
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
		>
			{/*
			 * Which icon shows is decided by CSS, not by React state. next-themes writes
			 * `class="dark"` on <html> from a blocking script before first paint, so both
			 * icons render identically on server and client and no mounted flag is needed.
			 */}
			<Sun className="size-4 dark:hidden" />
			<Moon className="hidden size-4 dark:block" />
		</Button>
	);
}
