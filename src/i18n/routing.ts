import { defineRouting } from "next-intl/routing";

export const locales = ["th", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "th";

/**
 * Thai is the default and stays unprefixed (`/jobs`); English lives under `/en/jobs`.
 *
 * The UI is bilingual, the data is not: announcements are published in Thai and are shown
 * in Thai in both locales. Only chrome — labels, filters, dates, emails — is translated.
 */
export const routing = defineRouting({
	locales,
	defaultLocale,
	localePrefix: "as-needed",
	localeDetection: true,
});
