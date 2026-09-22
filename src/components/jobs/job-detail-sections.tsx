import { Card, CardContent } from "@/components/ui/card";

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
			<h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
				{title}
			</h3>
			<p className="whitespace-pre-line text-pretty leading-relaxed">{body}</p>
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
			<CardContent className="grid gap-5 sm:grid-cols-2">{children}</CardContent>
		</Card>
	);
}
