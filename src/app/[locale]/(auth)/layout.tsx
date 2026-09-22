import { Link } from "@/i18n/navigation";
import { Landmark } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

/** Centred card, no app shell — a signed-out visitor has nothing to navigate yet. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
	const t = await getTranslations("app");

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12">
			<Link href="/" className="flex items-center gap-2.5">
				<span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
					<Landmark className="size-5" />
				</span>
				<span className="font-semibold text-lg tracking-tight">{t("name")}</span>
			</Link>

			<div className="w-full max-w-sm">{children}</div>
		</div>
	);
}
