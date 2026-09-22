import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { Building2, ChevronRight } from "lucide-react";
import Image from "next/image";

/**
 * A free-text block from the announcement.
 *
 * `whitespace-pre-line` matters: OCSC writes numbered requirements as
 * `"(1) ได้รับปริญญาตรี…\n(2) ได้รับ…"`, and collapsing those newlines would run the clauses
 * together into one unreadable paragraph.
 */
export function JobTextSection({
	title,
	body,
	seen,
}: {
	title: string;
	body: string | null;
	/**
	 * Bodies already rendered on this page. OCSC commonly writes the same sentence into
	 * description, knowledge, skill, competency and criteria — most often the placeholder
	 * "รายละเอียดตามประกาศรับสมัคร" — and five headings over five identical paragraphs is
	 * noise, not information. Mutated as sections render, so order decides which heading
	 * keeps the text.
	 */
	seen?: Set<string>;
}) {
	if (!body?.trim()) return null;

	const normalised = body.trim();
	if (seen) {
		if (seen.has(normalised)) return null;
		seen.add(normalised);
	}

	return (
		<section className="space-y-2">
			{/*
			 * `h2`, because the page heading is the job title — going straight to `h3` skipped a
			 * level and broke heading navigation for screen readers.
			 *
			 * No `uppercase tracking-wide` either: Thai has no case, so on this page it only ever
			 * styled the English build, and a muted heading printed lighter than the paragraph it
			 * labels inverts the hierarchy it is supposed to establish.
			 */}
			<h2 className="font-semibold text-base text-foreground tracking-tight">{title}</h2>
			{/*
			 * Full `foreground`, not `muted-foreground`. This paragraph is the announcement — the
			 * thing the reader came for — and secondary colour is for labels about content, not
			 * for content. Strengthening the heading above is what establishes the hierarchy; the
			 * body does not also have to be pushed down to achieve it.
			 *
			 * (Both clear 4.5:1 on a card: 17.8:1 here against `muted-foreground`'s 5.6:1. The
			 * choice is about rank, not contrast.)
			 */}
			<p className="max-w-[42rem] whitespace-pre-line text-pretty leading-relaxed">{body}</p>
		</section>
	);
}

export function JobFact({
	icon,
	label,
	children,
}: {
	icon: React.ReactNode;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-start gap-3">
			<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
				{icon}
			</span>
			<div className="min-w-0 space-y-0.5">
				<p className="text-muted-foreground text-xs">{label}</p>
				<div className="font-medium text-sm">{children}</div>
			</div>
		</div>
	);
}

export function JobFactCard({ children }: { children: React.ReactNode }) {
	return (
		<Card>
			{/*
			 * Three columns once there is room. At two, five facts leave a half-empty final row and
			 * the pairs sit so far apart that the eye stops reading them as one group.
			 */}
			<CardContent className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
				{children}
			</CardContent>
		</Card>
	);
}

/**
 * The agency's seal, on a light plate in both themes.
 *
 * OCSC serves these as dark line art on transparency, so dropping one straight onto the dark
 * surface renders a near-invisible smudge. The plate is what makes it legible either way —
 * and it is how the real announcement is identified, which is the point of showing it.
 */
export function AgencySeal({ src, className }: { src: string | null; className?: string }) {
	if (!src) {
		return (
			<span
				className={cn(
					"flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border",
					className
				)}
			>
				<Building2 className="size-6" />
			</span>
		);
	}

	return (
		<span
			className={cn(
				"flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 ring-1 ring-border",
				className
			)}
		>
			{/*
			 * `alt=""`: the agency name is printed right beside this, so announcing it again only
			 * makes a screen reader say the same thing twice.
			 */}
			<Image src={src} alt="" width={56} height={56} className="size-full object-contain" />
		</span>
	);
}

/**
 * Home › Jobs › this announcement.
 *
 * Replaces the lone "back to jobs" button. That button answered "how do I leave" but never
 * "where am I" — on a page reached from a search engine or a shared link, which is most of
 * them here, the reader arrives with no idea the site has a browsable index at all.
 *
 * The last crumb truncates rather than wraps: announcement titles run to 95 characters, and
 * a heading-length crumb stacked over three lines is worse than no crumb.
 */
export function JobBreadcrumb({
	label,
	home,
	jobs,
	current,
}: {
	label: string;
	home: string;
	jobs: string;
	current: string;
}) {
	return (
		<nav aria-label={label} className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-sm">
			<Link href="/" className="shrink-0 transition-colors hover:text-foreground">
				{home}
			</Link>
			<ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground/50" />
			<Link href="/jobs" className="shrink-0 transition-colors hover:text-foreground">
				{jobs}
			</Link>
			<ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground/50" />
			{/* `aria-current="page"`, and not a link: the last crumb is where the reader already is. */}
			<span aria-current="page" className="truncate text-foreground">
				{current}
			</span>
		</nav>
	);
}
