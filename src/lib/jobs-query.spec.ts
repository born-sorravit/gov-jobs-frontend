import {
	DEFAULT_PAGE_SIZE,
	MAX_PAGE_SIZE,
	buildJobsSearchParams,
	hasActiveFilters,
	jobsQueryKey,
	parseJobsSearchParams,
} from "@/lib/jobs-query";
import type { JobsQuery } from "@/types/api";
import { describe, expect, it } from "vitest";

/**
 * This module is the one piece of logic that runs on both sides of the SSR boundary: the
 * server page parses `searchParams`, the client hook parses `useSearchParams()`, and the two
 * must agree exactly or the first client render disagrees with the HTML.
 */
describe("parseJobsSearchParams", () => {
	it("reads the same query from a record and from URLSearchParams", () => {
		// The server gets a record, the browser gets URLSearchParams. One parser, one answer.
		const fromRecord = parseJobsSearchParams({ q: "นักวิชาการ", province: ["2", "14"], page: "3" });
		const fromParams = parseJobsSearchParams(
			new URLSearchParams("q=นักวิชาการ&province=2&province=14&page=3")
		);
		expect(fromRecord).toEqual(fromParams);
	});

	it("accepts repeated keys and a comma-separated list identically", () => {
		expect(parseJobsSearchParams({ province: ["2", "14"] }).province).toEqual([2, 14]);
		expect(parseJobsSearchParams({ province: "2,14" }).province).toEqual([2, 14]);
	});

	it("de-duplicates ids", () => {
		expect(parseJobsSearchParams({ province: ["2", "2", "14"] }).province).toEqual([2, 14]);
	});

	it("drops values that are not numbers rather than passing NaN to the API", () => {
		expect(parseJobsSearchParams({ province: ["2", "abc"] }).province).toEqual([2]);
		expect(parseJobsSearchParams({ province: "abc" }).province).toBeUndefined();
	});

	it("treats a blank search box as no search", () => {
		expect(parseJobsSearchParams({ q: "   " }).q).toBeUndefined();
		expect(parseJobsSearchParams({}).q).toBeUndefined();
	});

	it("ignores a status outside the enum instead of forwarding it", () => {
		expect(parseJobsSearchParams({ status: "OPEN" }).status).toBe("OPEN");
		expect(parseJobsSearchParams({ status: "BANANA" }).status).toBeUndefined();
	});

	it("ignores a sort key the API would reject", () => {
		expect(parseJobsSearchParams({ sortBy: "salaryMax" }).sortBy).toBe("salaryMax");
		expect(parseJobsSearchParams({ sortBy: "passwordHash" }).sortBy).toBeUndefined();
	});

	it("clamps paging", () => {
		expect(parseJobsSearchParams({ page: "0" }).page).toBe(1);
		expect(parseJobsSearchParams({ page: "-5" }).page).toBe(1);
		expect(parseJobsSearchParams({ limit: "5000" }).limit).toBe(MAX_PAGE_SIZE);
		expect(parseJobsSearchParams({}).limit).toBe(DEFAULT_PAGE_SIZE);
	});

	it("only treats provinceStrict as on when it is exactly 'true'", () => {
		expect(parseJobsSearchParams({ provinceStrict: "true" }).provinceStrict).toBe(true);
		expect(parseJobsSearchParams({ provinceStrict: "1" }).provinceStrict).toBeUndefined();
	});
});

describe("buildJobsSearchParams", () => {
	it("omits defaults so a pristine /jobs stays a clean URL", () => {
		expect(buildJobsSearchParams({ page: 1, limit: DEFAULT_PAGE_SIZE }).toString()).toBe("");
	});

	it("repeats a key per id, which is what class-validator reads as an array", () => {
		expect(buildJobsSearchParams({ province: [2, 14] }).toString()).toBe("province=2&province=14");
	});

	it("is stable regardless of how the query was assembled", () => {
		// The query key is built from this string, so an unstable order would fragment the cache.
		const a = buildJobsSearchParams({ q: "ก", province: [2], status: "OPEN" }).toString();
		const b = buildJobsSearchParams({ status: "OPEN", province: [2], q: "ก" }).toString();
		expect(a).toBe(b);
	});
});

describe("round trip", () => {
	const CASES: JobsQuery[] = [
		{ page: 1, limit: DEFAULT_PAGE_SIZE },
		{ q: "นักวิชาการคอมพิวเตอร์", page: 1, limit: DEFAULT_PAGE_SIZE },
		{ province: [2, 14], provinceStrict: true, page: 1, limit: DEFAULT_PAGE_SIZE },
		{ jobType: [1, 2], education: [8], jobCategory: [1], page: 2, limit: DEFAULT_PAGE_SIZE },
		{ status: "OPEN", salaryMin: 15000, salaryMax: 40000, page: 1, limit: DEFAULT_PAGE_SIZE },
		{ sortBy: "applicationEnd", order: "ASC", page: 1, limit: 50 },
	];

	it.each(CASES)("survives build → parse unchanged: %j", (query) => {
		const parsed = parseJobsSearchParams(buildJobsSearchParams(query));

		// `undefined` keys are absent either way, so compare only what was set.
		for (const [key, value] of Object.entries(query)) {
			expect(parsed[key as keyof JobsQuery]).toEqual(value);
		}
	});

	it("gives the same cache key for the same filters written differently", () => {
		const a = jobsQueryKey(parseJobsSearchParams({ province: ["14", "2"], q: "ก" }));
		const b = jobsQueryKey(parseJobsSearchParams(new URLSearchParams("q=ก&province=14&province=2")));
		expect(a).toEqual(b);
	});
});

describe("hasActiveFilters", () => {
	it("is false for a pristine query, so the empty state says the right thing", () => {
		expect(hasActiveFilters(parseJobsSearchParams({}))).toBe(false);
		expect(hasActiveFilters(parseJobsSearchParams({ page: "3" }))).toBe(false);
	});

	it.each([
		["a keyword", { q: "ก" }],
		["a province", { province: "2" }],
		["a status", { status: "OPEN" }],
		["a salary floor", { salaryMin: "15000" }],
	])("is true for %s", (_label, params) => {
		expect(hasActiveFilters(parseJobsSearchParams(params))).toBe(true);
	});
});
