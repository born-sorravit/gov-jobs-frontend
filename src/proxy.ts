import { routing } from "@/i18n/routing";
import createMiddleware from "next-intl/middleware";

/**
 * Next 16 renamed the middleware convention to `proxy`. next-intl still exposes it as
 * `createMiddleware`; only the file name and export changed.
 *
 * It resolves the locale from the URL prefix, then the cookie, then Accept-Language, and
 * rewrites so Thai stays unprefixed.
 */
export default createMiddleware(routing);

export const config = {
	// Everything except Next internals and anything that looks like a file.
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
