import type { Locale } from "@/i18n/routing";
import type { ReferenceOption } from "@/types/api";

/**
 * Thai readers expect Buddhist-era years (พ.ศ.), which is exactly what the
 * `th-TH-u-ca-buddhist` locale produces; English readers get Gregorian.
 */
export const formatDate = (
	value: string | Date | null | undefined,
	locale: Locale,
	options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string => {
	if (!value) return "—";
	const date = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(date.getTime())) return "—";

	return new Intl.DateTimeFormat(locale === "th" ? "th-TH-u-ca-buddhist" : "en-GB", {
		...options,
		timeZone: "Asia/Bangkok",
	}).format(date);
};

export const formatSalaryRange = (
	min: number | null | undefined,
	max: number | null | undefined,
	locale: Locale
): string | null => {
	if (!min && !max) return null;

	const format = new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US");
	if (min && max && min !== max) return `${format.format(min)}–${format.format(max)}`;
	return format.format((min ?? max) as number);
};

/** Picks the label for the active locale, falling back to Thai when we have no translation. */
export const referenceLabel = (option: ReferenceOption | undefined, locale: Locale): string => {
	if (!option) return "—";
	return locale === "en" ? (option.nameEn ?? option.nameTh) : option.nameTh;
};

/**
 * The API already returns `daysUntilDeadline`, computed against the same Bangkok instant as
 * the job's `status`, shared across the whole page. Recomputing it here from the browser
 * clock would let a card read "3 days left" beside a badge the server called CLOSED, so
 * there is deliberately no client-side equivalent — read the field.
 */
export const deadlineTone = (daysUntilDeadline: number | null): "past" | "urgent" | "normal" => {
	if (daysUntilDeadline === null) return "normal";
	if (daysUntilDeadline < 0) return "past";
	return daysUntilDeadline <= 7 ? "urgent" : "normal";
};
