# gov-jobs-frontend

Next.js app for **Gov Jobs Alert** — search Thai government job announcements, save them,
and manage email alerts. Talks to [`gov-jobs-backend`](../gov-jobs-backend).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (radix-nova) ·
TanStack Query · React Hook Form + Zod · next-intl · Motion

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

The backend must be running at `NEXT_PUBLIC_API_BASE_URL` (default
`http://localhost:3001/api/v1`).

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Internationalisation

`th` is the default locale and is **unprefixed** (`/jobs`); English lives under `/en/jobs`.
Routing is configured once in `src/i18n/routing.ts` and applied by `src/proxy.ts` (Next 16's
replacement for the middleware convention).

Import `Link`, `useRouter` and `usePathname` from `@/i18n/navigation`, never from
`next/navigation` — the originals drop the locale prefix on navigation.

**Only the UI is bilingual.** Job titles, agency names and requirements are published in
Thai by the source and are shown in Thai in both locales; translating them would
misrepresent an official announcement. What *is* translated: labels, filters, statuses,
dates and emails. The taxonomy tables (provinces, education levels, position types) carry
an English label from the backend, so filter chips read correctly in both locales.

Dates are formatted with `th-TH-u-ca-buddhist` for Thai (พ.ศ. years, as Thai readers
expect) and `en-GB` for English — see `src/lib/format.ts`. Everything is rendered in
`Asia/Bangkok`, matching how the source publishes deadlines.

Geist carries no Thai glyphs, so `Noto Sans Thai` is loaded alongside it and the two are
listed together in `--font-sans` for per-glyph fallback.

## Jobs page

The URL is the source of truth for every filter, so a search is shareable, survives a
reload, and the back button steps through filter changes. `src/lib/jobs-query.ts` is the
only place a URL becomes a `JobsQuery` — the server page and the client hook both call
`parseJobsSearchParams`, because two parsers that disagree mean a hydration mismatch or a
pointless refetch on mount. `buildJobsSearchParams` is its inverse and also produces the
TanStack Query key, so the same filters always map to the same cache entry.

`/jobs` is server-rendered with real data and then hydrated: the page fetches on the server
and hands the result to `JobsBrowser` as `initialData`, keyed by the serialised query it
corresponds to. The key check matters — seeding unconditionally would hand every filter
change the unfiltered first page while its own request is in flight, so the user would see
the wrong rows for a frame. A server fetch failure degrades to the client's own loading and
error states rather than breaking the page.

Two details the real data forced:

- **Nationwide postings get their own slot.** 10 of the 51 live announcements list no
  province. The card renders `ทั่วประเทศ` / "Nationwide" as a chip rather than an empty gap,
  and the province popover carries a `provinceStrict` switch — filtering ยะลา returns 10
  announcements by default and 0 strictly, which is exactly why the default includes them.
- **Position-type id 0 is the source's own "ไม่มีข้อมูล" placeholder** and is not rendered;
  otherwise a third of the cards would carry a chip that says "no data".

## Structure

```
src/
  app/
    layout.tsx           # required root; renders children only
    [locale]/            # the real shell — <html lang>, providers, pages
  components/
    ui/                  # shadcn primitives (generated, edit freely)
    providers/           # theme + TanStack Query + toaster
  i18n/                  # routing, request config, locale-aware navigation
  lib/
    api-client.ts        # the only place that calls fetch
    format.ts            # dates, salary ranges, reference labels
    env.ts               # NEXT_PUBLIC_* access
  types/api.ts           # mirrors the backend response contract
messages/                # th.json, en.json
```

`apiFetch` / `apiFetchPaginated` unwrap the backend's `{ status, message, data, meta }`
envelope and raise an `ApiError` carrying the backend's own message, so components never
deal with the envelope or with raw `Response` objects.

## Deployment

Vercel. Set `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_SITE_URL` in the project
environment; the backend's `CORS_ORIGINS` must include the deployed origin.

## Known gaps

- The shadcn `form` primitive is not installed — `npx shadcn add form` resolves against the
  registry and then writes nothing under the `radix-nova` style. React Hook Form and Zod are
  installed, so the `Form`/`FormField`/`FormMessage` wrappers get written by hand when the
  alert forms land.
