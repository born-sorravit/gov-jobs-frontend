"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Locale } from "@/i18n/routing";
import { referenceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReferenceOption } from "@/types/api";
import { Check, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface MultiSelectFilterProps {
	label: string;
	icon?: React.ReactNode;
	options: ReferenceOption[];
	selected: number[];
	onChange: (next: number[]) => void;
	className?: string;
	/** Rendered inside the popover under the list — used for the nationwide toggle. */
	footer?: React.ReactNode;
}

/**
 * A searchable multi-select. The province list is 77 entries long, so it is typeahead-first
 * rather than a plain scrolling list — and the search matches both languages, because a user
 * on the English UI may still type the Thai name.
 */
export function MultiSelectFilter({
	label,
	icon,
	options,
	selected,
	onChange,
	className,
	footer,
}: MultiSelectFilterProps) {
	const locale = useLocale() as Locale;
	const t = useTranslations("common");

	const toggle = (id: number) =>
		onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

	const summary =
		selected.length === 0
			? label
			: selected.length === 1
				? referenceLabel(
						options.find((option) => option.id === selected[0]),
						locale
					)
				: `${label} · ${selected.length}`;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					className={cn(
						"h-auto w-full justify-start gap-2 rounded-none px-4 py-3 font-normal",
						selected.length === 0 && "text-muted-foreground",
						className
					)}
				>
					{icon}
					<span className="min-w-0 flex-1 truncate text-left">{summary}</span>
					<ChevronDown className="size-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>

			<PopoverContent className="w-72 p-0" align="start">
				<Command
					filter={(value, search) =>
						value.toLowerCase().includes(search.toLowerCase().trim()) ? 1 : 0
					}
				>
					<CommandInput placeholder={`${t("search")}…`} />
					<CommandList>
						<CommandEmpty>{t("noResults")}</CommandEmpty>
						<CommandGroup>
							{options.map((option) => {
								const isSelected = selected.includes(option.id);
								return (
									<CommandItem
										key={option.id}
										// Both labels go into the searchable value so typing either language works.
										value={`${option.nameTh} ${option.nameEn ?? ""}`}
										onSelect={() => toggle(option.id)}
									>
										<span
											className={cn(
												"flex size-4 items-center justify-center rounded-[4px] border",
												isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"
											)}
										>
											{isSelected ? <Check className="size-3" /> : null}
										</span>
										<span className="truncate">{referenceLabel(option, locale)}</span>
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>

				{footer ? <div className="border-t p-3">{footer}</div> : null}

				{selected.length > 0 ? (
					<div className="border-t p-2">
						<Button variant="ghost" size="sm" className="w-full" onClick={() => onChange([])}>
							{t("clear")}
							<Badge variant="secondary">{selected.length}</Badge>
						</Button>
					</div>
				) : null}
			</PopoverContent>
		</Popover>
	);
}
