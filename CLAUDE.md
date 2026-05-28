# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project skills

This repo ships agent skills at `.claude/skills/` that enforce the boilerplate's conventions. They activate automatically based on the trigger phrases in their `description:` frontmatter — invoke them when the trigger matches:

- **`uipkge-first`** — before adding any UI primitive. Routes to `npx shadcn-vue add @uipkge/<name>` over hand-rolling.
- **`add-page`** — when creating any `app/pages/**/*.vue`. Picks layout, middleware, useHead correctly.
- **`auth-gating-check`** — when touching `server/api/**`, `server/routes/**`, `app/pages/**`, or `app/middleware/**`. Verifies auth posture.
- **`secret-exposure-check`** — before commit when env / runtimeConfig / logs changed. Catches the four canonical Nuxt leak vectors.
- **`logger-conventions`** — any log statement in `server/**`. Enforces dot-namespaced event names, structured fields, no PII.
- **`response-envelope`** — any new/modified `server/api/**` handler. Forces `apiHandler` + `ok()` / `apiError()` over raw responses.
- **`error-handling`** — any try/catch, throw, or rethrow. Enforces typed errors, no silent swallow, no leaked stack traces.
- **`i18n-keys`** — any `t('…')` / `$t('…')` call added/modified. Enforces key parity across en.json and es.json.
- **`db-migration`** — when `server/db/schema.ts` changes. Forces `drizzle-kit generate` and surfaces destructive ops.
- **`shipping-check`** — when the user signals "done" / "ready to commit". Runs lint + typecheck + knip + jscpd + boundary check.

Plus three external skills pulled from [skills.sh](https://skills.sh) and pinned in `skills-lock.json`:

- **`nuxt`** — `antfu/skills@nuxt`. Generated from the Nuxt docs.
- **`vue`** — `antfu/skills@vue`. Vue 3 Composition API reference.
- **`reka-ui`** — `onmax/nuxt-skills@reka-ui`. Headless Vue primitives that shadcn-vue is built on.

See `.claude/skills/README.md` for the rationale and how the skills relate to the tool-side enforcement (lefthook, commitlint, knip, jscpd, zod env).

## Commands

- `npm run dev` — Nuxt dev server on http://localhost:3000 (reuse if already running; do not kill).
- `npm run build` — production build.
- `npm run preview` — preview production build locally.
- `npm run generate` — static generate.
- `npm run lint` / `npm run lint:fix` — ESLint flat config via `@nuxt/eslint`.
- `npm run typecheck` — `vue-tsc --noEmit` via `nuxi typecheck`.
- `npm run knip` — unused files/exports/deps.
- `npm run duplicates` — `jscpd` copy-paste detection. Threshold 2.5%.
- `npm install` runs `nuxt prepare` + `lefthook install` via postinstall.
- Git hooks (lefthook): pre-commit runs `eslint --fix` on staged files; commit-msg runs commitlint (Conventional Commits).
- Drizzle (no npm-script wrappers; invoke directly):
  - `npx drizzle-kit generate` — emit SQL into `server/db/migrations/`.
  - `npx drizzle-kit migrate` — apply migrations against `DATABASE_URL`.
  - `npx drizzle-kit studio` — local schema browser.

## Architecture

**Nuxt 4** with the `app/` directory split. `compatibilityDate: 2025-07-15`. TypeScript via project references — root `tsconfig.json` points at the four generated `.nuxt/tsconfig.*.json` projects (app, server, shared, node). Do not put `compilerOptions` in the root `tsconfig.json`.

### Frontend (`app/`)

- `app/components/` is registered with `pathPrefix: false` — component filenames map directly to PascalCase auto-imports with no directory prefix (e.g. `blocks/AuthSignIn.vue` → `<AuthSignIn />`, not `<BlocksAuthSignIn />`). Rename collisions accordingly.
- Three component buckets:
  - `components/ui/` — shadcn-vue (style `new-york`, base color `neutral`) consumed via the `@uipkge` registry declared in `components.json`. Add components with `npx shadcn-vue add @uipkge/<name>`. Each ui dir exports via `index.ts`.
  - `components/blocks/` — composed page sections (auth forms, dashboard layout, sidebar, hero/cta/pricing variants, kanban, command palette, etc.).
  - `components/kanban/` — kanban-specific pieces.
- `app/layouts/dashboard.vue` wraps content in `<DashboardLayout>` and derives breadcrumbs from `route.path`. It reads `useUserSession()` and dispatches profile-menu / command-palette intents to the router.
- `app/pages/` — file-based routing. Top-level public: `index.vue`, `pricing.vue`, `terms.vue`, `privacy.vue`, auth entry pages (`login`, `sign-up`, `forgot-password`, `mfa`). Top-level authenticated: `onboarding/`, `invite/[token].vue`. Nested under `definePageMeta({ middleware: 'auth' })`: `dashboard/`, `settings/`, `projects/`, `feedback/`, `support/`.
- `app/middleware/auth.ts` is a **page-level** middleware (opt in via `definePageMeta({ middleware: 'auth' })`). Enforces real auth: unauthenticated requests redirect to `/login?next=…`. Demo mode (see graceful-degradation matrix below) keeps the boilerplate clickable without configuring OAuth.
- `app/lib/utils.ts` exports `cn()` (clsx + tailwind-merge) — the only shared frontend util.
- `app/composables/`:
  - `useTheme.ts` — three-state theme (`light` | `dark` | `system`) persisted to the **cookie** `uipkge-theme` (not localStorage). Cookie chosen so SSR and the inline boot script agree on the initial value and avoid hydration mismatch.
  - `useKanban.ts` + `kanbanData.ts` drive the kanban demo.

### Theme / FOUC

`server/plugins/theme.ts` is a Nitro plugin that injects a synchronous inline `<script>` into the SSR `<head>`. It reads the `uipkge-theme` cookie (and `prefers-color-scheme` for `system`) and toggles `dark` on `<html>` before paint. If you rename the cookie key, change it in **both** `server/plugins/theme.ts` and `app/composables/useTheme.ts`.

### Backend (`server/`)

- **Auth**: `nuxt-auth-utils` module. Session lives in an encrypted cookie (`NUXT_SESSION_PASSWORD`). Three signin paths, all converge on `setUserSession()`:
  - **GitHub OAuth** at `server/routes/auth/github.get.ts` (`defineOAuthGitHubEventHandler`) — upserts into `users` keyed on `githubId`. Sends `welcomeEmail` on first signin (heuristic: `createdAt ≈ updatedAt ≈ now`). Synthesises `<login>@users.noreply.github.com` when GitHub returns no public email since `users.email` is `NOT NULL UNIQUE`.
  - **Magic-link** at `server/routes/auth/magic-link.ts` (H3-style flexible-method): POST creates a hashed token row + emails the link; GET verifies (single-use, 15-min TTL), upserts user by email, sets session, redirects `/dashboard`. Tokens stored as SHA-256 hashes — raw never persisted.
  - **Demo** at `server/routes/auth/demo.post.ts` — mints a session for a fake `role: 'admin'` user when `isDemoMode` is true. 404s otherwise.
  - Logout is `POST /auth/logout` (`clearUserSession`). DB upsert paths are try/catch-wrapped so OAuth still works without `DATABASE_URL` — keep that behavior when extending.
- **DB**: Drizzle + `postgres-js`. `server/db/index.ts` exports `useDb()` as a lazy singleton (HMR-safe). Schema in `server/db/schema.ts` has four tables:
  - `users` — keyed by `email` (unique). `githubId` is nullable (magic-link users have none). Profile fields (`bio`, `timezone`, `locale`, `notifyEmail`, `notifyInApp`) live here.
  - `projects` — the canonical user-owned resource. Copy this shape (`id` + `slug` + `ownerId` FK with `ON DELETE CASCADE` + audit timestamps) when adding new product entities.
  - `subscriptions` — Polar.sh mirror. 1:1 with users (unique `userId`). The webhook handler is the only writer; treat it as the source of truth for plan/status.
  - `magic_link_tokens` — single-use sign-in tokens. Stores SHA-256 hash + `expiresAt` + `usedAt`.
- Migrations land in `server/db/migrations/` (config in `drizzle.config.ts`). Currently four: `0000` initial, `0001` projects + user profile, `0002` magic-link + email-as-identity, `0003` subscriptions. Run them in order with `npx drizzle-kit migrate` before traffic hits.
- **API envelope** (`server/utils/response.ts`): every `server/api/**` handler is wrapped with `apiHandler()`. Returns `{ ok: true, data: T }` on success, `{ ok: false, error: { code, message, details? } }` on thrown errors. Throw with `apiError(code, message, details?)`; `code` comes from the `ErrorCode` union (UNAUTHORIZED / SESSION_INVALID / FORBIDDEN / NOT_FOUND / VALIDATION_FAILED / RATE_LIMITED / INTERNAL). HTTP status is derived from code. Webhook receivers (`server/api/webhooks/**`) are exempt — they return bare status codes because the caller is the external service, not our client.
- **API filename convention**: methods are either filename-suffixed (`foo.get.ts` / `foo.post.ts` — one method per file) or H3-style flexible (`foo.ts` — branch on `event.method`). Use flexible when methods share heavy setup (auth + resource fetch). See `server/api/projects/index.ts` and `[slug].ts` for the pattern.
- **Guards** (`server/utils/guards.ts`): `requireAuth(event)` wraps `requireUserSession`. `requireRole(event, 'admin', ...)` re-reads role from DB on every call (session cookie has multi-day TTL; we don't trust its role for authorization). DB-unreachable falls back to cookie role with a `logger.warn`.
- **Logger** (`server/utils/logger.ts`): `logger.{debug,info,warn,error}(eventName, context)`. Event names are dot-namespaced (`auth.github.signin`, `db.query.failed`). Always prints via consola; ships to Axiom only when `AXIOM_TOKEN` + `AXIOM_DATASET` set (SDK lazy-imported so it never bundles when off). Never log session blobs, passwords, tokens.
- **Mailer** (`server/utils/mailer.ts`): `sendEmail({ to, subject, html, text, … })`. Templates: `welcomeEmail`, `magicLinkEmail`, `feedbackEmail`. Without `RESEND_API_KEY`, prints to consola (dev fallback). With it, the SDK is lazy-imported.
- **Billing** (`server/utils/polar.ts` + `server/api/billing/*` + `server/api/webhooks/polar.post.ts`): `getPolar()` returns a lazy-imported client. Polar's webhook is the source of truth for subscription state — `/api/billing/checkout` creates a session and redirects; the `subscriptions` table is updated by `/api/webhooks/polar` (signature-verified with raw body via `validateEvent`). Customers are linked to our users via `externalCustomerId = users.id`.

### Path aliases

- `@/…` → `app/…` (Nuxt default for the app dir).
- `~~/…` → repo root (use for `server/` imports from server code).
- shadcn-vue aliases in `components.json`: `@/components`, `@/composables`, `@/lib/utils`, `@/components/ui`, `@/lib`.

## Conventions

- Indent: 2 spaces. No semicolons. Single quotes. Match neighbors — formatting is enforced by example, not by a linter.
- Imports: dedupe — most Vue / Nuxt symbols are auto-imported. Don't re-import `ref`, `computed`, `useRoute`, `useRouter`, `useCookie`, `useUserSession`, `navigateTo`, `defineNuxtRouteMiddleware`, `defineNitroPlugin`, `defineEventHandler`, etc.
- Comments in this codebase explain **why** (e.g. why theme uses a cookie, why DB is a lazy singleton). Preserve that style; don't strip them when editing.
- Project conventions when adding UI: prefer adding a shadcn-vue component from the `@uipkge` registry over hand-rolling. Compose blocks from ui primitives.

## Environment

All env vars are zod-validated at boot via `server/utils/env.ts`. Missing/invalid values throw with a friendly error; partial pairs (e.g. `AXIOM_TOKEN` without `AXIOM_DATASET`) also throw. Import `env` from there instead of reading `process.env` directly.

### Graceful degradation matrix

The boilerplate is designed so a fresh `git clone` + `npm run dev` works without signing up for anything. Each external service degrades independently:

| Env var(s) | Unset behavior | Set behavior |
|---|---|---|
| `NUXT_SESSION_PASSWORD` | **Boot fails** — required (32+ chars). Generate via `openssl rand -base64 32`. | Sessions encrypted. |
| `NUXT_OAUTH_GITHUB_CLIENT_ID` + `_SECRET` | Demo mode auto-activates in dev. `/login` shows "Continue as demo user". | GitHub OAuth available; demo button disappears in production. |
| `NUXT_DEMO_MODE` | Auto: on in dev when OAuth unset, off in production. | `true` = always on (public previews). `false` = always off (hardens prod). |
| `DATABASE_URL` | OAuth handler skips DB upsert silently; `useDb()` throws if called. | Drizzle queries run; user upsert on signin. |
| `I18NOW_PROJECT_ID` (+ `I18NOW_API_KEY`) | `@i18now/nuxt` module not registered; `@nuxtjs/i18n` serves local `i18n/locales/*.json` only. | Translations also pulled from CDN, dev-time auto-sync of new keys. |
| `AXIOM_TOKEN` + `AXIOM_DATASET` | Logger prints to consola only (no shipping). | Logger ships structured events; Nitro plugin flushes on shutdown. |
| `RESEND_API_KEY` + `EMAIL_FROM` (+ `EMAIL_OPS`) | Mailer prints emails to consola only; nothing sent. | Real delivery via Resend. `EMAIL_OPS` is where in-app forms (feedback) deliver. |
| `NUXT_PUBLIC_SENTRY_DSN` | `@sentry/nuxt` module not registered; SDK not bundled. | Server + client init from `sentry.{server,client}.config.ts`; replay + traces. |
| `NUXT_PUBLIC_POSTHOG_KEY` | Client plugin no-ops; `posthog-js` chunk on disk but never fetched. | Pageviews + autocapture. Host defaults to `us.i.posthog.com`. |
| `POLAR_ACCESS_TOKEN` + `POLAR_WEBHOOK_SECRET` | `/api/billing/*` endpoints return INTERNAL with instructive message; SDK not loaded. | Checkout + portal + webhook subscription state. `POLAR_SERVER` toggles sandbox/production. |
| `NUXT_PUBLIC_SITE_URL` | Defaults to `http://localhost:3000`. | SEO/sitemap/OAuth redirects use the value. |
| `NUXT_INITIAL_ADMIN_LOGINS` | All new GitHub users default to `role='user'`. | Listed logins are created as `admin` on first sign-in (DB is source of truth after that). |

Rule when adding a new external integration: it must follow the same pattern — optional env, graceful no-op when absent, fail-loud when partially configured.

### Gating modules and plugins on env

Any module or plugin tied to an external service must **only activate when its env key is present**. Three concrete patterns are in use; pick the one that fits the integration:

1. **Conditional module registration** in `nuxt.config.ts` — for build-time Nuxt modules whose mere presence has cost (extra build hooks, extra dep loaded).
   ```ts
   modules: [
     '@nuxtjs/i18n',
     ...(process.env.I18NOW_PROJECT_ID ? ['@i18now/nuxt'] : []),
   ]
   ```
2. **Early-return in Nitro plugins** — when the plugin registers a hook that's a no-op without the service. See `server/plugins/logger.ts`: skips `nitroApp.hooks.hook('close', ...)` when `hasAxiom` is false.
3. **Dynamic `import()` of the SDK** — when the cost is bundle weight / cold-start latency. See `server/utils/logger.ts`: `@axiomhq/js` is `import('@axiomhq/js')` inside a lazy `getAxiom()` so it never resolves when the token is absent.

Anti-pattern: registering a module unconditionally and relying on it to "do nothing" without its key. Some modules (e.g. `nuxt-og-image`) crash at boot when their dependencies aren't installed; some bloat the bundle measurably; some inject runtime work even when idle. Gate at registration time, not inside the module.

When adopting Sentry, PostHog, or any future integration: follow pattern (1) at minimum; add (3) if the SDK is heavy.

## Notable gotchas

- `pathPrefix: false` means two components with the same filename in different subfolders **collide** — rename one.
- `.pilot-backup/` holds moved pages awaiting a registry-driven rebuild — ignore unless asked.
- `app/composables/kanbanData.ts` is ~30k of seed data; don't try to read or edit it in full unless needed.
- The demo session sets `role: 'admin'`. Real production should set `NUXT_DEMO_MODE=false`. Destructive admin endpoints should additionally check `session.demo !== true` if you keep demo on in any environment that touches real data.
- Database migrations run in numbered order. Apply all four (`0000` → `0003`) against a fresh `DATABASE_URL` before serving traffic. `drizzle-kit migrate` against an existing non-empty DB may fail on the `0002` `email SET NOT NULL` step if any row has a null email.
- The Polar webhook handler is the **only** writer to the `subscriptions` table. Never write to it from app code — Polar is the source of truth.
- The Polar webhook URL to configure in the Polar dashboard is `https://<your-host>/api/webhooks/polar`. Without it, checkout completes but the subscription row never lands.
- Magic-link tokens are single-use and expire in 15 minutes. The raw token never persists — only its SHA-256 hash. If you change the hash algorithm or token-encoding, in-flight tokens become invalid.
- Skill activations are not all visible in CLI output — when in doubt, invoke a relevant skill explicitly via the `Skill` tool rather than assuming it auto-fired.

## STRICT RULES

Violations of these rules are **never acceptable**. If a pattern not covered here appears to conflict, default to the most restrictive reading and ask before deviating.

### Rule 1 — UI: uipkge primitives only

Every authenticated page and every UI fragment in this template must be built from uipkge/shadcn-vue primitives. Hand-rolling what the registry already provides is a violation regardless of whether "it looks the same."

#### 1.1 Page shell mandatory

Every authenticated page **must** wrap its content in the `<Page>` shell:

```vue
<Page>
  <PageHeader>
    <PageHeaderHeading title="Page Title" description="Optional description" />
  </PageHeader>
  <PageBody>
    <!-- content -->
  </PageBody>
</Page>
```

Components live in `@/components/ui/page`. **A bare `<div class="space-y-6">` or a hand-rolled `<header>` used as the page title area is a violation.**

#### 1.2 Layout meta mandatory

Every authenticated page must have both of these at the top of `<script setup>`:

```ts
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Page Title — HMS' })
```

Missing either is a violation.

#### 1.3 Tables always wrapped

`<Table>` must never appear bare at the top level of a `<PageBody>` or `<TabsContent>`. It must always be wrapped in one of:

```vue
<!-- Option A: standalone table -->
<div class="rounded-md border">
  <Table>…</Table>
</div>

<!-- Option B: inside a card -->
<Card>
  <CardContent class="p-0">
    <Table>…</Table>
  </CardContent>
</Card>
```

A `<Table>` placed directly inside `<PageBody>`, `<TabsContent>`, or any section-level container without the `rounded-md border` wrapper or `<Card>` is a violation.

#### 1.4 Empty states

When a table has no rows, render an empty state inside `<TableEmpty>`:

```vue
<TableEmpty>
  <div class="flex flex-col items-center gap-2 py-8 text-center">
    <Icon class="text-muted-foreground size-8" />
    <p class="text-muted-foreground text-sm">No records found.</p>
  </div>
</TableEmpty>
```

A plain `<p>No data</p>` or conditional `v-if` block outside `<TableEmpty>` is a violation.

#### 1.5 Status uses Badge variant only

Status indication must use `<Badge variant="...">` exclusively. Never use `bg-red-*`, `bg-green-*`, `bg-yellow-*`, `text-red-*`, `text-green-*`, or `text-yellow-*` for status.

Canonical mapping:

| Status meaning | Badge variant |
|---|---|
| success / paid / completed / signed / final / active | `default` |
| warning / partial / pending / draft (muted context) | `secondary` |
| critical / failed / cancelled / destructive / overdue | `destructive` |
| neutral / available / outline context | `outline` |

Any hardcoded Tailwind color class used for status indication is a violation.

#### 1.6 Forms always use uipkge primitives

Every form field must use the uipkge form primitives:

```vue
<div class="space-y-1.5">
  <Label for="field-id">Field label</Label>
  <Input id="field-id" v-model="state.field" />
</div>
```

Use `<Select>`, `<Textarea>`, `<Checkbox>`, `<Switch>`, or `<RadioGroup>` for their respective input types.

**Raw `<input>`, `<button>`, `<select>`, or `<textarea>` elements are always a violation.** Each field group wraps in `<div class="space-y-1.5">`.

#### 1.7 Multi-section forms use SectionCard

Forms with multiple logical sections (e.g. admit, discharge, book-surgery) group each section in `<SectionCard>`:

```vue
<SectionCard title="Section Title" description="Optional description">
  <!-- fields -->
</SectionCard>
```

A bare `<Card>` with a hand-rolled `<CardHeader><CardTitle>…</CardTitle></CardHeader>` is a violation when `<SectionCard>` exists and fits.

#### 1.8 KPI rows

Dashboard KPI rows must use `<KpiGrid>` with `<DashboardKpiTile>` children. If those components are not available, fall back to a consistent grid of `<Card>` with `<CardHeader>` + `<CardTitle>` + `<CardContent>`:

```vue
<KpiGrid>
  <DashboardKpiTile title="Metric" :value="42" />
</KpiGrid>

<!-- fallback only when KpiGrid unavailable -->
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Card v-for="kpi in kpis" :key="kpi.title">
    <CardHeader><CardTitle class="text-sm font-medium">{{ kpi.title }}</CardTitle></CardHeader>
    <CardContent><p class="text-2xl font-bold">{{ kpi.value }}</p></CardContent>
  </Card>
</div>
```

Hand-rolled non-grid KPI layouts (flex rows, ad-hoc divs) are a violation.

#### 1.9 Dialogs always structured

Every dialog must follow this exact structure. Missing `<DialogClose>` for the cancel path is a violation.

```vue
<Dialog v-model:open="open">
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Optional description.</DialogDescription>
    </DialogHeader>

    <!-- body content -->

    <DialogFooter>
      <DialogClose as-child>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button @click="submit">Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 1.10 Tabs

```vue
<Tabs default-value="tab-a">
  <TabsList>
    <TabsTrigger value="tab-a">Label A</TabsTrigger>
    <TabsTrigger value="tab-b">Label B</TabsTrigger>
  </TabsList>
  <TabsContent value="tab-a">
    <div class="rounded-md border">
      <Table>…</Table>
    </div>
  </TabsContent>
</Tabs>
```

Each `<TabsContent>` that contains a table still needs the `rounded-md border` wrapper per rule 1.3.

#### 1.11 Buttons and icons

```vue
<Button variant="default">
  <Icon class="mr-2 h-4 w-4" />
  Label
</Button>
```

Allowed variants: `default | outline | ghost | secondary | destructive | link`.
Allowed sizes: `default | sm | lg | icon`.

**A raw `<button>` element is always a violation**, including small affordances like chip-remove X buttons.

#### 1.12 Loading states

- Tables while pending: render `<Skeleton>` rows instead of the real rows.
- In-flight buttons: include `<Loader2 class="mr-2 h-4 w-4 animate-spin" />` inside the `<Button>` when `pending` is true.

A `<p v-if="loading">Loading…</p>` or any plain text loading indicator is a violation.

#### 1.13 Currency formatting

All monetary values must go through `Intl.NumberFormat`:

```ts
function rupees(cents: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}
```

Money columns in tables use `class="text-right tabular-nums"`. **String concatenation such as `'₹' + (cents / 100)` is a violation.**

#### 1.14 Chip-list remove pattern

```vue
<Badge variant="outline">
  {{ value }}
  <Button variant="ghost" size="icon" class="ml-1 h-4 w-4" @click="remove(value)">
    <X class="h-3 w-3" />
  </Button>
</Badge>
```

**A raw `<button>` for the chip-remove X is a violation.**

#### 1.15 Icons

All icons come from `lucide-vue-next`. No emoji, no inline SVG, no Heroicons, no other icon packages.

#### 1.16 Allowed plain HTML elements

The following plain HTML elements are permitted: `<div>`, `<span>`, `<h1>`–`<h6>`, `<p>`, `<ul>`, `<li>`, `<section>`, `<aside>`, `<article>`, `<header>` (semantic structural only, not as a page title replacement), `<footer>` (semantic only).

**Never use plain HTML for form controls (`<input>`, `<button>`, `<select>`, `<textarea>`) or table markup (`<table>`, `<tr>`, `<td>`, `<th>`).**

#### 1.17 Reference pages

When uncertain about the expected pattern for a page, use these as ground truth:

- `app/pages/support/index.vue` — Card + Accordion + Badge layout
- `app/pages/billing/[id].vue` — bill detail with SectionCard + Table + Dialog
- Phase-T dashboard pages — KpiGrid / DashboardKpiTile usage

---

### Rule 1.5 — Before-commit checklist

Run this checklist mentally before every commit that touches a page or component:

- [ ] Page uses `<Page>` / `<PageHeader>` / `<PageBody>`
- [ ] `definePageMeta` + `useHead` present on every authenticated page
- [ ] All `<Table>` wrapped in `<div class="rounded-md border">` or `<Card>`
- [ ] No raw `<input>` / `<button>` / `<select>` / `<textarea>` / `<table>`
- [ ] No `bg-red-*` / `text-green-*` (or any status color) — only `<Badge variant>`
- [ ] All Dialogs have `<DialogClose>` for the cancel path
- [ ] All `<Button>` have correct variant; icons use `class="mr-2 h-4 w-4"`
- [ ] Currency rendered via `Intl.NumberFormat`, money columns right-aligned with `tabular-nums`

---

### Rule 2 — Don't invent what the registry already provides

Before hand-rolling any UI pattern, check the `@uipkge` registry (`npx shadcn-vue add @uipkge/<name>`). If the component exists there, use it. Do not copy-paste or reimplement it locally.

### Rule 3 — Page structure

- One `<script setup>` block per file.
- `definePageMeta` first, then `useHead`, then composables, then reactive state, then computed, then functions, then lifecycle hooks.
- No Options API. No `export default {}`. No `<script>` (non-setup).

### Rule 4 — No direct DB or API calls from page components

Pages and components call composables or `$fetch` / `useFetch`. Never import or call Drizzle, `useDb()`, or server utilities from `app/` code.

### Rule 5 — What not to do

- Don't add dependencies without confirming they aren't already provided by Nuxt, VueUse, or the existing `package.json`.
- Don't use `any` in TypeScript except as a last resort with an explanatory comment.
- Don't log PII (patient names, MRNs, DOBs, contact details) to the console or structured logger.
- Don't bypass the `apiHandler` / `ok()` / `apiError()` envelope in server routes.
- Don't commit `.env*` files or secrets.
