import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

/**
 * The app's search box: a magnifier sitting inside the field, not beside it.
 *
 * One component for the sidebar shortcut and the jobs page filter bar. They were written out
 * twice and had already drifted — the sidebar kept the `Input` with its own border and fill
 * while the jobs page grew a wrapper `div` that drew its own, so the same control looked like
 * two different ones on the same screen.
 *
 * The icon is absolutely positioned with matching `pl-9` on the field rather than laid out in
 * a flex row, so the input itself still fills the whole box: clicking anywhere in the control,
 * including the icon's corner, puts the caret in the text.
 */
export function SearchField({
	className,
	...props
}: React.ComponentProps<typeof Input>) {
	return (
		<div className="relative">
			<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
			<Input type="search" className={cn("h-9 bg-background pl-9", className)} {...props} />
		</div>
	);
}
