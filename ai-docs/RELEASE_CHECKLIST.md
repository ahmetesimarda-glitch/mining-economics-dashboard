# RELEASE_CHECKLIST.md

> Production release checklist for the **Mining Economics Dashboard**. Repository-specific and consistent with `PROJECT_CONTEXT.md`, `BUSINESS_RULES.md`, `DATABASE.md`, `ARCHITECTURE.md`, `CODING_STANDARDS.md`, and `.cursor/rules/mining-dashboard.mdc`.
>
> Work top to bottom. A **blocker** must be fixed before release; a **warning** should be resolved or explicitly accepted. Every item states its **purpose**, **how to verify**, **common failure causes**, and **recommended fixes**.

---

## 1. Project Health

**Purpose:** confirm the working tree is releasable and matches intent.
- **How to verify:** clean git status (only intended changes); dependencies installed with **yarn**; `yarn.lock` unchanged unless deps were intentionally updated; app boots with `yarn dev`.
- **Common failure causes:** stray debug code; accidental `npm`/`pnpm` lockfiles; uncommitted schema drift.
- **Recommended fixes:** revert incidental edits; delete non-yarn lockfiles; regenerate `yarn.lock` via yarn only. **(Blocker on boot failure.)**

## 2. Documentation

**Purpose:** keep `ai-docs/` a truthful knowledge base.
- **How to verify:** if code/schema/flows changed, the matching `ai-docs/` file was updated in the same change; docs are internally consistent.
- **Common failure causes:** new endpoint/model/flow shipped without doc update; formula change (if explicitly requested) not reflected in `BUSINESS_RULES.md`.
- **Recommended fixes:** update the affected doc(s) now; never modify source-of-truth docs unless the underlying code actually changed. **(Warning.)**

## 3. TypeScript

**Purpose:** guarantee type safety (`strict: true`).
- **How to verify:** `yarn tsc --noEmit` passes with zero errors; no new `any`/`@ts-ignore`.
- **Common failure causes:** loosened types to force compilation; Prisma types stale after schema edit.
- **Recommended fixes:** run `yarn prisma generate`; type precisely; remove suppressions. **(Blocker — the self-host build sets `typescript.ignoreBuildErrors: false`.)**

## 4. Build

**Purpose:** ensure both build targets succeed.
- **How to verify:** `yarn build` succeeds; for self-host, build with `next.config.github.js` (standalone) produces `server.js`.
- **Common failure causes:** `window`/`document` used during SSR; import of a server-only module in a client component; missing env at build.
- **Recommended fixes:** move browser code into client components/effects; split server/client boundaries. **(Blocker.)**

## 5. Lint

**Purpose:** catch obvious defects.
- **How to verify:** `yarn lint`. Note the managed build sets `eslint.ignoreDuringBuilds: true`, so lint will NOT fail the build — run it manually.
- **Common failure causes:** unused vars, missing hook deps, accessibility lint warnings.
- **Recommended fixes:** address warnings; do not rely on the build to catch them. **(Warning.)**

## 6. Prisma

**Purpose:** client and schema are in sync and safe.
- **How to verify:** `yarn prisma generate` runs in the build; schema changes are additive; `binaryTargets` still include `native` and `linux-musl-arm64-openssl-3.0.x`.
- **Common failure causes:** forgetting generate in CI; removing a model/field/relation; dropping the `linux-musl-arm64` target (breaks the Alpine container).
- **Recommended fixes:** keep changes additive; restore binary targets; regenerate. **(Blocker on missing musl target for container deploys.)**

## 7. Database

**Purpose:** protect shared data during migration.
- **How to verify:** migration is backward-compatible; NO `--accept-data-loss` / `--force-reset`; `@@unique([projectId, year])`, cascade relations, and `projectId` indexes intact; backfill provided for new non-null columns.
- **Common failure causes:** destructive migration on shared DB; new required column without default/backfill.
- **Recommended fixes:** make columns nullable or defaulted + backfill; use additive migrations only; get explicit approval before any destructive step. **(Blocker.)**

## 8. API

**Purpose:** endpoints behave per contract.
- **How to verify:** every route under `app/api/**` still has `export const dynamic = "force-dynamic"`; existing route/method signatures unchanged; analysis routes read-and-recompute (never mutate); error shapes correct (`404 { error:'Proje bulunamadı' }`, `500 { error }`, list → `[]` at 200).
- **Common failure causes:** missing `force-dynamic` (stale build-time data); accidental mutation in an analysis route; broken error contract.
- **Recommended fixes:** restore `force-dynamic`; ensure analysis routes only compute and return. **(Blocker.)**

## 9. Authentication

**Purpose:** verify the intended access model.
- **How to verify:** authentication is **not yet implemented** (no auth models/routes; `next-auth` installed but unused — see `ROADMAP.md`). Confirm the deployment target is acceptable as effectively open, or that auth was added as an additive change with `NEXTAUTH_URL`/`NEXTAUTH_SECRET` configured.
- **Common failure causes:** exposing an unauthenticated app publicly by mistake; misconfigured `NEXTAUTH_URL` if auth was added.
- **Recommended fixes:** restrict network exposure, or implement auth per the roadmap before public launch. **(Blocker only if the deployment requires access control.)**

## 10. Authorization

**Purpose:** verify data isolation expectations.
- **How to verify:** with no auth, all projects are visible to anyone with access — confirm this is acceptable. If auth was added, confirm `/api/projects/**` queries are scoped to the owner and cross-tenant access is blocked.
- **Common failure causes:** listing/reading another user's project; unscoped queries.
- **Recommended fixes:** add ownership scoping (`userId`) after auth. **(Blocker for multi-user deployments.)**

## 11. Environment Variables

**Purpose:** all required config present, no secrets leaked.
- **How to verify:** `DATABASE_URL` set; `NEXTAUTH_URL` correct for the environment (auto-set on Abacus; must match the real URL on self-host); optional `ABACUSAI_API_KEY` (AI only); Chrome/Chromium available for PDF (`PUPPETEER_EXECUTABLE_PATH` / `CHROME_PATH` on Railway/Docker); no secrets in the repo or client bundle.
- **Common failure causes:** missing `DATABASE_URL`; wrong `NEXTAUTH_URL`; AI/PDF failing due to missing key; secret hardcoded.
- **Recommended fixes:** populate from `.env.example`; read secrets only server-side. **(Blocker on missing `DATABASE_URL`.)**

## 12. Financial Calculations

**Purpose:** the economic engine is correct and unchanged unless explicitly requested.
- **How to verify:** confirm no unintended edits to `lib/calculations.ts`; on a representative project, NPV / IRR / payback / breakeven match the pre-release baseline; invariants hold (Year-0 = −(capex+forest+land+rehab); royalty on revenue; tax only when taxable income > 0; results in MUSD).
- **Common failure causes:** incidental formula/constant edit; refactor changing outputs; unit/scaling mistake.
- **Recommended fixes:** revert any unrequested engine change; diff outputs against baseline. **(Blocker — highest priority.)**

## 13. Monte Carlo

**Purpose:** risk simulation is stable and unchanged.
- **How to verify:** `/api/projects/[id]/montecarlo` returns a distribution with the documented parameters (2000 iterations; σ price 15% / cost 10% / production 8%; floor 0.5×; 20-bin histogram); statistics look sane.
- **Common failure causes:** altered iteration count/volatilities; performance timeout on large projects (synchronous compute).
- **Recommended fixes:** restore parameters; if latency is an issue, move to background jobs per `ROADMAP.md` (without changing results). **(Blocker if parameters changed.)**

## 14. Sensitivity

**Purpose:** sensitivity/economic-sensitivity outputs are correct.
- **How to verify:** `/api/projects/[id]/sensitivity` and `/economic-sensitivity` return expected ± ranges, elasticities, spider/two-way data; values reconcile with the engine.
- **Common failure causes:** changed variation ranges; driver mislabeled.
- **Recommended fixes:** restore ranges; verify each driver maps to the correct parameter. **(Warning.)**

## 15. Tornado

**Purpose:** tornado diagram ranking is correct.
- **How to verify:** `/api/projects/[id]/tornado` returns ±20% ranked bars + waterfall ordered by impact magnitude.
- **Common failure causes:** wrong sort order; missing driver; sign error.
- **Recommended fixes:** verify ranking and signs against sensitivity results. **(Warning.)**

## 16. Charts

**Purpose:** visualizations render correctly and safely.
- **How to verify:** Recharts / Chart.js / Plotly charts render in light and dark themes; no SSR/hydration errors in the console; tooltips/labels localized.
- **Common failure causes:** chart lib touching `window` during SSR; nondeterministic render; color/contrast issues in one theme.
- **Recommended fixes:** keep charts client-only; deterministic render; fix theme contrast. **(Blocker on hydration errors.)**

## 17. Dashboard

**Purpose:** the landing/list experience is accurate.
- **How to verify:** dashboard lists projects ordered by `updatedAt desc`, shows cached headline metrics (npv, irr, payback, status), and open/create/compare/duplicate actions work.
- **Common failure causes:** recomputing analytics on the dashboard (slow); stale cached metrics after an edit.
- **Recommended fixes:** read cached results only; ensure writes recompute + persist results. **(Warning.)**

## 18. AI Analysis

**Purpose:** streaming AI narrative works and stays read-only.
- **How to verify:** `/api/projects/[id]/ai-analysis` streams SSE (`text/event-stream; charset=utf-8`), renders progressively in `ai-analysis-panel.tsx`, and the `finalizeBuffer` repair handles stream end; the AI never writes financial values back.
- **Common failure causes:** missing `ABACUSAI_API_KEY`; broken stream contract; malformed JSON not repaired; upstream latency/timeout.
- **Recommended fixes:** set the key; preserve the streaming contract and repair logic; handle upstream failures gracefully. **(Warning — feature degrades, core app still works.)**

## 19. PDF Export

**Purpose:** PDF generation succeeds via the external service.
- **How to verify:** `/api/projects/[id]/pdf` renders HTML locally via Puppeteer (`renderHtmlToPdf`) and returns a valid multi-page PDF; no outbound Abacus HTML2PDF calls; Chrome/Chromium must be resolvable.
- **Common failure causes:** missing key/URL; relative asset paths unreachable in production; polling timeout.
- **Recommended fixes:** configure env; use absolute/public asset URLs; handle `FAILED`/timeout paths. **(Warning.)**

## 20. Excel Export

**Purpose:** spreadsheet export is correct.
- **How to verify:** `/api/projects/[id]/xlsx` downloads a valid workbook whose values match on-screen figures and units (MUSD scaling).
- **Common failure causes:** re-deriving values in the export (drift); unit mismatch; corrupted file.
- **Recommended fixes:** source values from stored data/engine results; keep units consistent. **(Warning.)**

## 21. Responsive Design

**Purpose:** usable on small screens.
- **How to verify:** dashboard, project detail, forms, and charts are usable at mobile widths; no overflow/clipping.
- **Common failure causes:** fixed widths; charts not resizing; tables overflowing.
- **Recommended fixes:** responsive Tailwind utilities; responsive chart containers. **(Warning.)**

## 22. Accessibility

**Purpose:** meet basic a11y expectations.
- **How to verify:** semantic markup; labeled form controls; keyboard navigation on Radix components; descriptive `alt` text; sufficient contrast in both themes.
- **Common failure causes:** icon-only buttons without labels; low contrast; unlabeled inputs.
- **Recommended fixes:** add labels/aria; fix contrast; ensure focus-visible. **(Warning.)**

## 23. Performance

**Purpose:** acceptable latency and payloads.
- **How to verify:** project reads avoid unnecessary full `include` fan-out; heavy simulations complete within acceptable time; client bundle not bloated by chart/map libs on pages that don't need them.
- **Common failure causes:** synchronous Monte Carlo on large projects; over-fetching relations; eager chart imports.
- **Recommended fixes:** `select` needed scalars; lazy-load heavy client libs; consider background jobs per `ROADMAP.md`. **(Warning.)**

## 24. Security

**Purpose:** no obvious vulnerabilities.
- **How to verify:** secrets server-side only and absent from client/logs; error responses don't leak internals; input validated at the boundary; no raw SQL injection paths; endpoints don't return unrelated projects' data.
- **Common failure causes:** secret in client env; verbose error leakage; unscoped queries (see Authorization).
- **Recommended fixes:** move secrets server-side; sanitize errors; validate input. **(Blocker on secret exposure.)**

## 25. Caching

**Purpose:** market cache behaves correctly.
- **How to verify:** `/api/market` serves cached data within the ~5-minute TTL and refreshes after; understand it is in-memory per instance (not shared across replicas).
- **Common failure causes:** assuming shared cache across replicas; hammering upstream on cache miss storms.
- **Recommended fixes:** accept per-instance behavior for now, or implement shared cache per `ROADMAP.md`. **(Warning.)**

## 26. Logging

**Purpose:** failures are traceable.
- **How to verify:** handlers use `console.error('<context>:', error)` with meaningful context; no secrets logged.
- **Common failure causes:** swallowed errors; logging sensitive data.
- **Recommended fixes:** add contextual logs; strip secrets. **(Warning.)**

## 27. Error Handling

**Purpose:** graceful failures, correct status codes.
- **How to verify:** try/catch around I/O; conventional error shapes; list endpoint degrades to `[]` at 200; external (AI/PDF) failures handled without crashing core flows.
- **Common failure causes:** unhandled rejection; wrong status; external failure breaking the page.
- **Recommended fixes:** wrap and shape errors; isolate external-service failures. **(Blocker on unhandled crashes.)**

## 28. Monitoring

**Purpose:** production visibility.
- **How to verify:** confirm how errors/health are observed in the target environment (currently `console.error` + platform logs; see `ROADMAP.md` observability item).
- **Common failure causes:** no visibility into production errors.
- **Recommended fixes:** rely on platform logs now; add structured monitoring later. **(Warning.)**

## 29. Railway / Self-Host Deployment

**Purpose:** the standalone deployment is correct.
- **How to verify:** built with `next.config.github.js` (`output: 'standalone'`); multi-stage `Dockerfile` (`node:20-alpine`, non-root `nextjs`, `CMD ["node","server.js"]`, port 3000); a PostgreSQL service provisioned and `DATABASE_URL` pointing to it; `NEXTAUTH_URL` matches the deployed URL; `prisma generate` runs in build; migrations/seed idempotent. Cross-check `SELF_HOST_GUIDE.md`.
- **Common failure causes:** wrong config used; DB not reachable; missing musl Prisma binary; destructive seed; port mismatch.
- **Recommended fixes:** use the standalone config; fix env/DB wiring; keep binary targets; idempotent seeds. **(Blocker for self-host releases.)**

## 30. Regression Testing

**Purpose:** completed modules still work end-to-end.
- **How to verify:** exercise create → view → edit → duplicate → delete; run each analysis (sensitivity, economic-sensitivity, tornado, Monte Carlo, environmental, financing, operational); market page; AI; PDF; Excel; compare; TR/EN toggle; dark/light theme.
- **Common failure causes:** a change silently breaking an unrelated module; i18n key missing; cascade delete not firing.
- **Recommended fixes:** fix the specific regression; verify against the completed-modules list in `ROADMAP.md`. **(Blocker on any broken completed module.)**

## 31. Post-Release Verification

**Purpose:** confirm the live deployment is healthy.
- **How to verify:** open the deployed URL; create/open a project and confirm metrics render; run one analysis, one AI stream, one PDF, one Excel export against production; check logs for errors; verify `NEXTAUTH_URL`/env resolved correctly at runtime.
- **Common failure causes:** stale build-time env (missing `force-dynamic`); external services unreachable in prod; propagation delay after deploy.
- **Recommended fixes:** confirm `force-dynamic` on affected routes; validate env; allow propagation time before concluding a mismatch. **(Blocker on core-flow failure in production.)**

---

## Release sign-off

A release is approved only when: all **Blocker** items pass (especially §12 Financial Calculations, §13 Monte Carlo, §7 Database, §3/§4 TypeScript/Build, §8 API, §30 Regression), and every **Warning** is either resolved or explicitly accepted and recorded. Record the baseline NPV/IRR of a reference project before and after release to prove the financial engine is unchanged.
