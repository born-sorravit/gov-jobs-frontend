"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, useState } from "react";

/**
 * Keywords as chips.
 *
 * A plain comma-separated text field is a trap here: Thai job titles contain no spaces a
 * user would think of as separators, and it is genuinely unclear whether one long phrase is
 * one keyword or several. Chips make each keyword visible as its own unit.
 */
export function KeywordInput({
	value,
	onChange,
}: {
	value: string[];
	onChange: (next: string[]) => void;
}) {
	const t = useTranslations("alertForm");
	const [draft, setDraft] = useState("");

	const commit = () => {
		const keyword = draft.trim();
		if (!keyword || value.includes(keyword)) {
			setDraft("");
			return;
		}
		onChange([...value, keyword]);
		setDraft("");
	};

	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter" || event.key === ",") {
			// Enter must not submit the surrounding form while the user is still adding chips.
			event.preventDefault();
			commit();
			return;
		}
		if (event.key === "Backspace" && draft === "" && value.length > 0) {
			onChange(value.slice(0, -1));
		}
	};

	return (
		<div className="space-y-2">
			<Input
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				onKeyDown={onKeyDown}
				onBlur={commit}
				placeholder={t("keywordsPlaceholder")}
				aria-label={t("keywords")}
			/>

			{value.length > 0 ? (
				<div className="flex flex-wrap gap-2">
					{value.map((keyword) => (
						<Badge key={keyword} variant="secondary" className="gap-1 py-1 pr-1 pl-2.5 font-normal">
							<span className="max-w-56 truncate">{keyword}</span>
							<button
								type="button"
								onClick={() => onChange(value.filter((entry) => entry !== keyword))}
								aria-label={`${t("removeKeyword")}: ${keyword}`}
								className="rounded-full p-0.5 hover:bg-background/70"
							>
								<X className="size-3" />
							</button>
						</Badge>
					))}
				</div>
			) : null}

			<p className="text-muted-foreground text-xs">{t("keywordsHint")}</p>
		</div>
	);
}
