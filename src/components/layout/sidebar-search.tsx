"use client";

import { SearchField } from "@/components/common/search-field";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * A shortcut into the jobs page, not a second search implementation.
 *
 * It submits to `/jobs?q=…`, which is exactly the URL the search bar on that page produces,
 * so the results, the filters and the back button all behave the same whichever one is used.
 */
export function SidebarSearch({ onNavigate }: { onNavigate?: () => void }) {
	const t = useTranslations("nav");
	const router = useRouter();
	const [value, setValue] = useState("");

	return (
		<form
			role="search"
			onSubmit={(event) => {
				event.preventDefault();
				const query = value.trim();
				router.push(query ? `/jobs?q=${encodeURIComponent(query)}` : "/jobs");
				onNavigate?.();
			}}
		>
			<SearchField
				value={value}
				onChange={(event) => setValue(event.target.value)}
				placeholder={t("searchPlaceholder")}
				aria-label={t("searchPlaceholder")}
			/>
		</form>
	);
}
