import { callAuth, clearSessionCookies, readTokens } from "@/lib/auth/session";
import { NextResponse } from "next/server";

/**
 * Deleting the account also ends the session, so the cookies have to go with it — which the
 * `/api/backend` proxy cannot do.
 */
export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	if (!body || typeof body !== "object") {
		return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
	}

	const { accessToken } = await readTokens();
	if (!accessToken) {
		return NextResponse.json({ message: "Not signed in" }, { status: 401 });
	}

	const result = await callAuth<null>("me", body, { method: "DELETE", accessToken });

	// The account survives a failed call, so the session must too — otherwise a mistyped
	// password would sign someone out of an account they still have.
	if (!result.ok) {
		return NextResponse.json({ message: result.message }, { status: result.status });
	}

	await clearSessionCookies();
	return NextResponse.json({ ok: true });
}
