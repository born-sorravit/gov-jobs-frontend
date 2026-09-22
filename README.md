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

## Job detail

`/jobs/[id]` is fully server-rendered. Three decisions worth knowing:

- **No `loading.tsx` on this segment, deliberately.** A `loading.tsx` turns the route into a
  stream, and Next commits the HTTP status with the first chunk — so `notFound()` resolved
  later still returned **200**. Verified both ways: with the file, a missing announcement
  answered 200; without it, 404. Announcements are removed from the source portal routinely
  (four disappeared overnight during development), so these 404s are real and frequent, and
  serving them as 200 would get dead pages indexed. Correct status wins over the skeleton.
- **`notFound()` only on a real 404.** `apiFetch` raises `ApiError` carrying the status; any
  other failure is rethrown. A cold backend must not render "this job doesn't exist" for an
  announcement that does.
- **Identical free-text blocks are printed once.** OCSC often writes the same sentence —
  usually "รายละเอียดตามประกาศรับสมัคร" — into description, knowledge, skill, competency and
  criteria. `JobTextSection` takes a shared `seen` set and skips a body already rendered,
  which on real announcements collapses seven headings to three.

The original announcement (`sourceUrl`) is the primary button, above the agency's
application site — this is an index of public announcements, and a reader must always be
able to reach and verify the source.

**Not yet built:** Save job and Create alert. Both need authentication, which lands in
steps 7–9; a button that does nothing is worse than no button.

## Sessions

Tokens live in **first-party httpOnly cookies set by this app**, never by the API.

The frontend deploys to Vercel and the API to Render — different sites — so a cookie set by
the API would be third-party, which Safari's ITP already blocks and Chrome is phasing out.
Instead the route handlers under `src/app/api/auth/` call the API, take the tokens out of the
response and write them as our own cookies. Nothing token-shaped ever reaches page
JavaScript; a rendered page contains the user's name and no credentials.

- `src/app/api/backend/[...path]` proxies **authenticated** calls, attaching the bearer token
  server-side. Public job browsing still goes straight to the API, so the extra hop is not on
  the path that matters for page load. The proxy drops the browser's `Cookie` header on the
  way out and upstream `Set-Cookie` on the way back, so no other origin can write into our
  session.
- On a 401 it rotates once and retries. Concurrent requests share one in-flight refresh
  promise — and because that only helps within a single instance, the API also forgives a
  just-rotated token for a few seconds.
- **Refreshing a stale session happens in `src/proxy.ts` (middleware).** It is the only
  thing that runs before a page renders and can still write cookies. A server component
  cannot do it — rotation revokes the presented token and the replacement could never be
  persisted — and doing it on mount in the client meant a signed-out header for one frame on
  every stale load. Middleware rewrites the request's own cookies too, so the page renders
  with the new token in the same pass.

Reading cookies in the locale layout makes every page dynamic; `/` is no longer statically
prerendered.

## Saved jobs

The bookmark toggle is optimistic and invalidates exactly two keys: the saved id set and the
saved list. The `["jobs", …]` keys are left alone — cards are marked client-side from the id
set, so `GET /jobs` stays public and identical for everyone, and invalidating those keys
would refetch every cached page for nothing.

A signed-out visitor clicking bookmark is sent to `/login?next=<current path and query>` and
returns to the same filtered list. `requireUser()` is the single place that gate lives, so
every protected page bounces the same way.

`/saved` renders its list client-side through the proxy, so the page HTML is the shell and
the cards arrive after hydration — unlike `/jobs`, which is server-rendered because it is
public and worth indexing.

## Admin page

`requireAdmin()` has two outcomes, deliberately: a signed-out visitor goes to
`/login?next=/admin`, but a signed-in account **without** the role gets a 404. Bouncing them
to a login form they have already passed would be a loop, and a 404 does not confirm the page
exists. The sidebar hides the link for non-admins — an affordance, not the boundary; the API
re-reads the role from the database on every admin request.

The page is `robots: noindex`.

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

## Tests

```bash
npm test   # vitest, 24 specs
```

Scoped deliberately to `src/lib/jobs-query.ts`: it is the one piece of logic that runs on
**both** sides of the SSR boundary — the server page parses `searchParams`, the client hook
parses `useSearchParams()` — and if the two ever disagree the result is a hydration mismatch
or a pointless refetch on mount. The suite includes a build → parse round trip and checks
that the same filters written differently produce the same TanStack Query key.

No jsdom and no component tests. These are pure functions, and page behaviour is verified by
driving the real app in a browser, which catches more than a shallow render would.

## Known gaps

- The shadcn `form` primitive is not installed — `npx shadcn add form` resolves against the
  registry and then writes nothing under the `radix-nova` style. React Hook Form and Zod are
  installed, so the `Form`/`FormField`/`FormMessage` wrappers get written by hand when the
  alert forms land.
