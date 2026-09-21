import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			// Agency seals are served straight from the OCSC portal.
			{ protocol: "https", hostname: "job.ocsc.go.th" },
		],
	},
};

export default withNextIntl(nextConfig);
