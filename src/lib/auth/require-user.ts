import "server-only";

import { getCurrentUser } from "@/lib/auth/session";
import type { AuthUser } from "@/types/api";
import { notFound, redirect } from "next/navigation";

/**
 * The gate for a protected page.
 *
 * Kept in one place so every protected route bounces the same way and comes back to where
 * the user was heading. `next` is a path on this site, and `AuthForm` only honours values
 * starting with `/`, so it cannot be used to redirect someone off-site after signing in.
 */
export async function requireUser(returnTo: string): Promise<AuthUser> {
	const user = await getCurrentUser();

	if (!user) {
		redirect(`/login?next=${encodeURIComponent(returnTo)}`);
	}

	return user;
}

/**
 * The gate for an admin-only page.
 *
 * Two different outcomes, deliberately: a signed-out visitor is sent to sign in, but a
 * signed-in account without the role gets a 404. Bouncing them to a login form they have
 * already passed would be a loop, and a 404 does not confirm the page exists.
 *
 * The role here comes from the session; the API re-reads it from the database on every admin
 * request, so this is a UI affordance, not the security boundary.
 */
export async function requireAdmin(returnTo: string): Promise<AuthUser> {
	const user = await getCurrentUser();

	if (!user) {
		redirect(`/login?next=${encodeURIComponent(returnTo)}`);
	}

	if (user.role !== "ADMIN") {
		notFound();
	}

	return user;
}
