"use client";

import { useSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import {
	type LoginValues,
	type RegisterValues,
	loginSchema,
	registerSchema,
} from "@/lib/auth/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

type Mode = "login" | "register";

/**
 * Posts to the Next route handler, not to the API.
 *
 * The handler is what exchanges credentials for tokens and writes them into httpOnly
 * cookies — so no token ever exists anywhere a script on this page could read it.
 */
export function AuthForm({ mode }: { mode: Mode }) {
	const t = useTranslations("auth");
	const tErrors = useTranslations("errors");
	const router = useRouter();
	const searchParams = useSearchParams();
	const { refresh } = useSession();
	const [serverError, setServerError] = useState<string | null>(null);

	const isRegister = mode === "register";
	const form = useForm<RegisterValues | LoginValues>({
		resolver: zodResolver(isRegister ? registerSchema : loginSchema),
		defaultValues: isRegister ? { name: "", email: "", password: "" } : { email: "", password: "" },
	});

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = form;

	const onSubmit = handleSubmit(async (values) => {
		setServerError(null);

		const response = await fetch(`/api/auth/${mode}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(values),
		}).catch(() => null);

		if (!response) {
			setServerError(tErrors("unreachableHint"));
			return;
		}

		if (!response.ok) {
			const payload = (await response.json().catch(() => null)) as { message?: string } | null;
			setServerError(payload?.message ?? tErrors("generic"));
			return;
		}

		await refresh();
		// `next` lets a protected page send the user here and get them back afterwards. Only
		// relative paths are honoured, so it cannot be used to bounce someone off-site.
		const next = searchParams.get("next");
		router.replace(next?.startsWith("/") ? next : "/");
		router.refresh();
	});

	const fieldError = (field: string) =>
		(errors as Record<string, { message?: string } | undefined>)[field]?.message;

	return (
		<form onSubmit={onSubmit} className="space-y-4" noValidate>
			{serverError ? (
				<Alert variant="destructive">
					<AlertCircle className="size-4" />
					<AlertDescription>{serverError}</AlertDescription>
				</Alert>
			) : null}

			{isRegister ? (
				<div className="space-y-2">
					<Label htmlFor="name">{t("name")}</Label>
					<Input id="name" autoComplete="name" {...register("name" as "email")} />
					{fieldError("name") ? (
						<p className="text-destructive text-sm">{t("nameRequired")}</p>
					) : null}
				</div>
			) : null}

			<div className="space-y-2">
				<Label htmlFor="email">{t("email")}</Label>
				<Input id="email" type="email" autoComplete="email" {...register("email")} />
				{fieldError("email") ? <p className="text-destructive text-sm">{t("emailInvalid")}</p> : null}
			</div>

			<div className="space-y-2">
				<Label htmlFor="password">{t("password")}</Label>
				<Input
					id="password"
					type="password"
					autoComplete={isRegister ? "new-password" : "current-password"}
					{...register("password")}
				/>
				{fieldError("password") ? (
					<p className="text-destructive text-sm">
						{isRegister ? t("passwordTooShort") : t("passwordRequired")}
					</p>
				) : null}
				{isRegister ? <p className="text-muted-foreground text-xs">{t("passwordHint")}</p> : null}
			</div>

			<Button type="submit" className="w-full" disabled={isSubmitting}>
				{isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
				{isRegister ? t("createAccount") : t("signIn")}
			</Button>
		</form>
	);
}
