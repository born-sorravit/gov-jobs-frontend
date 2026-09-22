import type { AuthUser } from "@/types/api";

const PROXY = "/api/backend";

export interface ProfileInput {
	name?: string;
	locale?: string;
}

const message = async (response: Response, fallback: string): Promise<string> => {
	const payload = (await response.json().catch(() => null)) as { message?: string } | null;
	return payload?.message ?? fallback;
};

/**
 * Name and email language.
 *
 * Goes through the proxy because nothing about the session changes — unlike the password and
 * deletion calls, which have to be able to rewrite the session cookies.
 */
export const updateProfile = async (input: ProfileInput): Promise<AuthUser> => {
	const response = await fetch(`${PROXY}/auth/me`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!response.ok) throw new Error(await message(response, response.statusText));

	const payload = (await response.json()) as { data: AuthUser };
	return payload.data;
};

export const changePassword = async (input: {
	currentPassword: string;
	newPassword: string;
}): Promise<void> => {
	const response = await fetch("/api/auth/change-password", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!response.ok) throw new Error(await message(response, response.statusText));
};

export const deleteAccount = async (password: string): Promise<void> => {
	const response = await fetch("/api/auth/delete-account", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ password }),
	});
	if (!response.ok) throw new Error(await message(response, response.statusText));
};
