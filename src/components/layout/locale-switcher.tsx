"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, locales } from "@/i18n/routing";
import { Check, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

const LABELS: Record<Locale, string> = { th: "ไทย", en: "English" };

export function LocaleSwitcher() {
	const locale = useLocale() as Locale;
	const t = useTranslations("common");
	const router = useRouter();
	// `usePathname` from @/i18n/navigation already strips the locale prefix; the search
	// params are separate and must be carried over or switching language drops the filters.
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const switchTo = (next: Locale) => {
		const query = searchParams.toString();
		router.replace(`${pathname}${query ? `?${query}` : ""}`, { locale: next });
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" aria-label={t("language")}>
					<Languages className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{locales.map((entry) => (
					<DropdownMenuItem key={entry} onClick={() => switchTo(entry)}>
						<Check className={entry === locale ? "size-4" : "size-4 opacity-0"} />
						{LABELS[entry]}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
