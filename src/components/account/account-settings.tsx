"use client";

import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { changePassword, deleteAccount, updateProfile } from "@/lib/api/account";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const MIN_PASSWORD = 8;

const LOCALE_LABELS: Record<string, string> = { th: "ไทย", en: "English" };

function Section({
	title,
	hint,
	children,
	tone,
}: {
	title: string;
	hint: string;
	children: React.ReactNode;
	tone?: "danger";
}) {
	return (
		<Card className={tone === "danger" ? "border-destructive/40" : undefined}>
			<CardContent className="space-y-5">
				<div className="space-y-1">
					<h2
						className={`font-medium text-sm ${tone === "danger" ? "text-destructive" : ""}`}
					>
						{title}
					</h2>
					<p className="text-muted-foreground text-xs">{hint}</p>
				</div>
				{children}
			</CardContent>
		</Card>
	);
}

export function AccountSettings() {
	const t = useTranslations("account");
	const tErrors = useTranslations("errors");
	const { user, reload } = useSession();
	const router = useRouter();

	const [name, setName] = useState(user?.name ?? "");
	const [locale, setLocale] = useState(user?.locale ?? "th");
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deletePassword, setDeletePassword] = useState("");

	const profile = useMutation({
		mutationFn: () => updateProfile({ name: name.trim(), locale }),
		onSuccess: async () => {
			toast.success(t("saved"));
			// The header shows the name, and it was server-rendered.
			await reload();
			router.refresh();
		},
		onError: (error: Error) => toast.error(error.message || tErrors("generic")),
	});

	const password = useMutation({
		mutationFn: () => changePassword({ currentPassword: current, newPassword: next }),
		onSuccess: () => {
			toast.success(t("passwordChanged"));
			setCurrent("");
			setNext("");
			setConfirm("");
		},
		onError: (error: Error) => toast.error(error.message || tErrors("generic")),
	});

	const removal = useMutation({
		mutationFn: () => deleteAccount(deletePassword),
		onSuccess: () => {
			toast.success(t("deleted"));
			setDeleteOpen(false);
			// A hard replace, not a push: there is no account to go back to.
			router.replace("/");
			router.refresh();
		},
		onError: (error: Error) => toast.error(error.message || tErrors("generic")),
	});

	if (!user) return null;

	const profileUnchanged = name.trim() === user.name && locale === user.locale;
	const passwordProblem =
		next.length > 0 && next.length < MIN_PASSWORD
			? t("tooShort")
			: confirm.length > 0 && next !== confirm
				? t("mismatch")
				: null;
	const canChangePassword =
		current.length > 0 && next.length >= MIN_PASSWORD && next === confirm;

	return (
		<div className="space-y-6">
			<Section title={t("profile")} hint={t("profileHint")}>
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						profile.mutate();
					}}
				>
					<div className="space-y-2">
						<Label htmlFor="account-name">{t("name")}</Label>
						<Input
							id="account-name"
							value={name}
							maxLength={120}
							onChange={(event) => setName(event.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="account-email">{t("email")}</Label>
						<Input id="account-email" value={user.email} readOnly disabled />
						<p className="text-muted-foreground text-xs">{t("emailFixed")}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="account-locale">{t("language")}</Label>
						<select
							id="account-locale"
							value={locale}
							onChange={(event) => setLocale(event.target.value)}
							className="h-9 w-full rounded-md border bg-card px-3 text-sm"
						>
							{locales.map((entry) => (
								<option key={entry} value={entry}>
									{LOCALE_LABELS[entry]}
								</option>
							))}
						</select>
					</div>

					<Button
						type="submit"
						disabled={profile.isPending || profileUnchanged || name.trim().length === 0}
					>
						{t("save")}
					</Button>
				</form>
			</Section>

			<Section title={t("password")} hint={t("passwordHint")}>
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						password.mutate();
					}}
				>
					<div className="space-y-2">
						<Label htmlFor="account-current">{t("currentPassword")}</Label>
						<Input
							id="account-current"
							type="password"
							autoComplete="current-password"
							value={current}
							onChange={(event) => setCurrent(event.target.value)}
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="account-new">{t("newPassword")}</Label>
							<Input
								id="account-new"
								type="password"
								autoComplete="new-password"
								value={next}
								onChange={(event) => setNext(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="account-confirm">{t("confirmPassword")}</Label>
							<Input
								id="account-confirm"
								type="password"
								autoComplete="new-password"
								value={confirm}
								onChange={(event) => setConfirm(event.target.value)}
							/>
						</div>
					</div>

					{passwordProblem ? (
						<p className="text-destructive text-xs">{passwordProblem}</p>
					) : null}

					<Button type="submit" disabled={password.isPending || !canChangePassword}>
						{t("changePassword")}
					</Button>
				</form>
			</Section>

			<Section title={t("dangerZone")} hint={t("dangerHint")} tone="danger">
				<Button variant="destructive" onClick={() => setDeleteOpen(true)}>
					{t("deleteAccount")}
				</Button>
			</Section>

			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("confirmDeleteTitle")}</DialogTitle>
						<DialogDescription>{t("confirmDeleteBody")}</DialogDescription>
					</DialogHeader>

					<div className="space-y-2">
						<Label htmlFor="account-delete-password">{t("passwordToConfirm")}</Label>
						<Input
							id="account-delete-password"
							type="password"
							autoComplete="current-password"
							value={deletePassword}
							onChange={(event) => setDeletePassword(event.target.value)}
						/>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteOpen(false)}>
							{t("cancel")}
						</Button>
						<Button
							variant="destructive"
							disabled={removal.isPending || deletePassword.length === 0}
							onClick={() => removal.mutate()}
						>
							{t("deleteAccount")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
