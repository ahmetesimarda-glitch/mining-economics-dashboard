# PROMPTS.md

> Production-quality prompt library for AI-assisted development of the **Mining Economics Dashboard**. These prompts are tuned for this repository and are designed to work in **Cursor**, **Claude Code**, and **GitHub Copilot (Chat)**.
>
> They all assume the AI agent has access to and will read the repository knowledge base before doing anything.

---

## How to use this library

1. Pick the prompt that matches your task.
2. Paste it into your AI tool and replace the `{{PLACEHOLDERS}}`.
3. Do not delete the standard preamble — it is what protects the financial engine and architecture.

### Standard preamble (every prompt includes this)

> **Context you MUST read before writing any code:**
> - `ai-docs/PROJECT_CONTEXT.md`
> - `ai-docs/BUSINESS_RULES.md`
> - `ai-docs/DATABASE.md`
> - `ai-docs/ARCHITECTURE.md`
> - `ai-docs/CODING_STANDARDS.md`
> - `.cursor/rules/mining-dashboard.mdc`
>
> **Hard constraints for every task:**
> - Analyze the repository first; trace every number to `lib/calculations.ts` — never guess how a value is computed.
> - **Never** modify a financial formula, default parameter, or calculation constant unless I explicitly and specifically ask for that exact change. If you think a formula is wrong, stop and ask.
> - Preserve the invariants in `BUSINESS_RULES.md` (Year-0 outflow, royalty-on-revenue, tax gating, MUSD scaling) and the DB invariants (`@@unique([projectId, year])`, cascade deletes, additive-only migrations).
> - Keep `export const dynamic = "force-dynamic"` on all API routes. Use the Prisma singleton `@/lib/prisma`. Strict TypeScript, no `any`, no `@ts-ignore`.
> - Reuse `components/ui/` primitives and `lib/` helpers. Route all user-facing strings through `lib/i18n/translations.ts` (TR + EN).
> - Do not duplicate code, do not rename/move files as a side effect, make the smallest correct diff.
> - **At the end, list every file you changed and explain why each change was necessary.**

---

## 1. New Feature

> [Standard preamble]
>
> **Task:** Implement a new feature: `{{FEATURE}}`.
>
> Before coding: (1) map which existing modules, API routes, and engine functions this touches; (2) confirm the data it needs already exists in the schema or propose an **additive** schema change; (3) describe your plan in 5–10 lines and where each piece lives per `ARCHITECTURE.md` (presentation / API / engine / data). Reuse existing analysis routes and engine functions rather than adding parallel logic. Do not introduce new financial math — compose existing `lib/calculations.ts` exports. Then implement, and finish with the changed-files explanation.

## 2. Small Feature

> [Standard preamble]
>
> **Task:** Small, self-contained change: `{{FEATURE}}`.
>
> Keep the diff minimal and local. Identify the single file (or few files) responsible, reuse existing helpers/primitives, and do not refactor anything unrelated. Add TR+EN i18n entries if any user-facing text is involved. End with the changed-files explanation.

## 3. Large Feature

> [Standard preamble]
>
> **Task:** Large multi-module feature: `{{FEATURE}}`.
>
> First produce a written implementation plan broken into phases, each phase independently shippable and non-breaking. Explicitly state: schema impact (additive only), new/changed API routes (preserve existing signatures), engine reuse (no formula changes), UI components to reuse, i18n keys, and how you will avoid regressions to completed modules listed in `ROADMAP.md`. Wait for my confirmation of the plan before implementing if the change is risky. Implement phase by phase. End each phase with a changed-files explanation.

## 4. Bug Fix

> [Standard preamble]
>
> **Task:** Fix this bug: `{{BUG + REPRO STEPS}}`.
>
> Reproduce/understand the root cause before patching. Enumerate every code path touching the affected feature (search the repo) and confirm the fix covers all of them. Patch against the current file contents. Do not “fix” a financial formula to make a number look right — if the discrepancy is in the engine, stop and ask. Verify by running the actual code path (call the route / exercise the function), not just by reading code. End with root cause + changed-files explanation.

## 5. Critical Bug Fix

> [Standard preamble]
>
> **Task:** URGENT production bug: `{{BUG}}`.
>
> Prioritize a minimal, low-risk, reversible fix. Do NOT refactor. Confirm the fix does not alter any financial output for existing projects (compare NPV/IRR/cash-flow before and after on a representative project). Note any data implications. Provide: root cause, the exact minimal change, how you verified it, and rollback steps. End with the changed-files explanation.

## 6. Refactor

> [Standard preamble]
>
> **Task:** Refactor `{{TARGET}}` for `{{GOAL: readability/reuse/typing}}` with **zero behavior change**.
>
> Prove behavior is preserved: financial outputs, API request/response shapes, and DB writes must be identical. Do not touch `lib/calculations.ts` numeric logic. Keep the folder structure and public signatures. Make the change in small, reviewable steps. End with a changed-files explanation and a statement of how you confirmed no behavior changed.

## 7. Performance Optimization

> [Standard preamble]
>
> **Task:** Optimize performance of `{{TARGET}}`.
>
> First measure/identify the actual bottleneck (query fan-out, synchronous simulation, client bundle, missing index) and state it. Optimize without changing results: engine outputs must be identical, and DB changes must be additive (e.g. an index built `CONCURRENTLY`). Prefer `select` over full `include`, reuse the market-cache pattern, and keep heavy compute-on-write. End with before/after reasoning and the changed-files explanation.

## 8. Database Migration

> [Standard preamble] + read `DATABASE.md` in full.
>
> **Task:** Schema change: `{{CHANGE}}`.
>
> The change MUST be additive and backward-compatible. Never run `prisma db push --accept-data-loss` or `--force-reset`. Preserve every existing model, field, relation, the `@@unique([projectId, year])` constraint, and all `onDelete: Cascade` relations. Provide the exact `schema.prisma` diff, the migration strategy, any required backfill for existing rows, and how create (nested write) and update (delete-and-recreate) paths must change. Update `DATABASE.md` in the same change. End with the changed-files explanation.

## 9. API Development

> [Standard preamble]
>
> **Task:** Add/modify API route: `{{ROUTE}}`.
>
> Follow the existing handler pattern exactly: `export const dynamic = "force-dynamic"`, defensive input handling, delegate all math to `lib/calculations.ts`, persist via `@/lib/prisma`, and use the conventional error shape (`404 { error: 'Proje bulunamadı' }`, `500 { error }`, list endpoints degrade to `[]` at 200). Do not change existing route/method signatures. Analysis routes must read-and-recompute, never mutate the project. End with the changed-files explanation.

## 10. Prisma Changes

> [Standard preamble] + read `DATABASE.md`.
>
> **Task:** `{{PRISMA CHANGE}}`.
>
> Additive only. Keep cuid PKs, cascade relations, and per-project indexes. If you add a model, wire it as a cascade-deleted child of `MiningProject` unless I say otherwise. Regenerate the client (`yarn prisma generate`). State the impact on seed scripts (`scripts/seed.ts` / `safe-seed.ts` must stay idempotent). Update `DATABASE.md`. End with the changed-files explanation.

## 11. UI Improvements

> [Standard preamble] + consult `STYLE_GUIDE.md`.
>
> **Task:** `{{UI CHANGE}}`.
>
> Reuse `components/ui/` primitives (Radix-based) and existing feature components. Preserve the dark-default theme and design tokens; ensure contrast in both themes. Client-only libraries (charts/maps) must not access `window`/`document` during SSR, and render must be deterministic (no `Math.random()`/`Date.now()`/`new Date()` in render or state init) to avoid hydration errors. Add TR+EN i18n entries. End with the changed-files explanation.

## 12. Dashboard Improvements

> [Standard preamble]
>
> **Task:** Improve the dashboard (`app/page.tsx` → `DashboardClient`, `project-card.tsx`): `{{CHANGE}}`.
>
> Reuse the existing list/fetch flow and headline-metric fields cached on `MiningProject` (npv, irr, paybackPeriod, status). Do not recompute analytics on the dashboard — read cached results. Keep it responsive and accessible. Add TR+EN strings. End with the changed-files explanation.

## 13. Chart Improvements

> [Standard preamble]
>
> **Task:** `{{CHART CHANGE}}`.
>
> Match the chart library already used in the target area (Recharts / Chart.js / Plotly) rather than introducing a new one. Charts are client-only. Do not recompute financial series in the component — consume the values returned by the relevant analysis route or the cached `CashFlowYear` data. Keep tooltips/labels localized (TR+EN). End with the changed-files explanation.

## 14. AI Improvements

> [Standard preamble]
>
> **Task:** `{{AI CHANGE}}` in `app/api/projects/[id]/ai-analysis/route.ts` / `ai-analysis-panel.tsx`.
>
> Preserve the streaming SSE contract (`text/event-stream; charset=utf-8`, `ReadableStream`) and the `finalizeBuffer` JSON-repair step. Keep the API key server-side only (`process.env.ABACUSAI_API_KEY`), model `claude-sonnet-4-6`. The AI is **read-only** over financials — it must never write NPV/IRR/cash-flow values back to the project. Elasticities must come from `sensitivityAnalysis`, not new math. End with the changed-files explanation.

## 15. Documentation Update

> [Standard preamble]
>
> **Task:** Update docs after `{{CHANGE}}`.
>
> Update only the affected `ai-docs/` file(s) and keep them consistent with each other and the code. Everything must be repository-specific and accurate to the current tree — no generic filler. Do not modify the source-of-truth docs unless the underlying code actually changed. End with the changed-files explanation.

## 16. Security Audit

> [Standard preamble] + read `CODING_STANDARDS.md` §9.
>
> **Task:** Audit `{{SCOPE}}` for security issues.
>
> Check: secrets never reach the client or logs (`ABACUSAI_API_KEY`, `DATABASE_URL`); endpoints do not leak other projects' data; untrusted input is validated at the API boundary; no injection via Prisma raw queries; error responses do not leak internals. Note the current absence of auth/authorization (see `ROADMAP.md`) where relevant. Produce a findings list (severity + fix) and only implement fixes I approve. End with the changed-files explanation.

## 17. Performance Audit

> [Standard preamble]
>
> **Task:** Audit `{{SCOPE}}` for performance.
>
> Look for: full `include` fan-out, synchronous heavy simulations in the request path, missing indexes on filtered columns, per-request Prisma client construction, oversized client bundles from chart/map libs, and cache misuse. Report findings with evidence and recommended additive fixes. Do not change engine outputs. End with the changed-files explanation.

## 18. Code Review

> [Standard preamble]
>
> **Task:** Review the diff/PR `{{REF}}`.
>
> Check against `CODING_STANDARDS.md` and `.cursor/rules/mining-dashboard.mdc`: no formula changes, additive schema only, `force-dynamic` intact, Prisma singleton, strict types/no `any`, i18n for user text, minimal diff, no silent renames. Flag any regression risk to completed modules. Give a prioritized review (blocking / non-blocking / nit). Do not rewrite the code unless asked.

## 19. Testing

> [Standard preamble] + read `ROADMAP.md` (test infrastructure item).
>
> **Task:** Add tests for `{{TARGET}}`.
>
> Prioritize pure-function unit tests for `lib/calculations.ts` that pin the invariants in `BUSINESS_RULES.md` (Year-0 outflow, royalty basis, tax gating, MUSD scaling, IRR, Monte Carlo statistics with a fixed seed if introduced). For API routes, test the read-and-recompute behavior and error shapes. Use a lightweight runner consistent with the repo (none is configured yet — propose one and justify it). Do not change engine logic to make tests pass. End with the changed-files explanation.

## 20. Deployment

> [Standard preamble] + read `ARCHITECTURE.md` §10 and `RELEASE_CHECKLIST.md`.
>
> **Task:** Prepare/verify a deployment for `{{TARGET ENV}}`.
>
> Confirm the correct config is used (`next.config.js` for the managed build, `next.config.github.js` for standalone/self-host), required env vars are set (`DATABASE_URL`, `NEXTAUTH_URL`, optional `ABACUSAI_API_KEY`, optional `HTML2PDF_API_URL`), `yarn prisma generate` runs in the build, and the TypeScript build passes (self-host enforces type errors). Walk the `RELEASE_CHECKLIST.md`. Do not commit secrets. End with a go/no-go summary.

## 21. Railway Deployment

> [Standard preamble] + read `SELF_HOST_GUIDE.md`, `Dockerfile`, `docker-compose.yml`.
>
> **Task:** Deploy/troubleshoot on Railway.
>
> Use the standalone path (`next.config.github.js`, multi-stage `Dockerfile` on `node:20-alpine`, non-root `nextjs` user, `CMD ["node","server.js"]`, port 3000). Ensure a PostgreSQL service is provisioned and `DATABASE_URL` points to it, `NEXTAUTH_URL` matches the Railway URL, and `prisma generate` runs during build (the generator already targets `linux-musl-arm64-openssl-3.0.x`). Run migrations/seed safely (idempotent, no destructive resets). Report the exact env/config changes; never hardcode secrets. End with the changed-files explanation.

## 22. PDF Improvements

> [Standard preamble]
>
> **Task:** `{{PDF CHANGE}}` in `app/api/projects/[id]/pdf/route.ts`.
>
> Preserve the Abacus HTML2PDF flow: POST to `createConvertHtmlToPdfRequest` → poll `getConvertHtmlToPdfStatus` for `SUCCESS`/`FAILED`/timeout → decode base64 to a Buffer. Do not attempt local headless rendering (unavailable in production). Use absolute/public asset URLs or the runtime base URL for images. Keep report numbers sourced from the engine/stored results — no recomputation drift. Localize report text (TR+EN). End with the changed-files explanation.

## 23. Excel Improvements

> [Standard preamble]
>
> **Task:** `{{EXCEL CHANGE}}` in `app/api/projects/[id]/xlsx/route.ts`.
>
> Use the installed `xlsx` (SheetJS). Source all values from stored project data and engine results — do not re-derive financials in the export. Keep column semantics and units consistent with the on-screen values and `BUSINESS_RULES.md` (MUSD scaling). Preserve the existing sheet structure unless I ask to change it. End with the changed-files explanation.

## 24. Database Optimization

> [Standard preamble] + read `DATABASE.md` §5.
>
> **Task:** Optimize database access for `{{SCOPE}}`.
>
> Additive changes only. Prefer indexes matched to access patterns (status filter, `projectId` lookups) built `CONCURRENTLY`; replace unnecessary `include` with scalar `select`; reduce delete-and-recreate write amplification only if you can prove identical resulting state. Respect the ephemeral-connection / limited-pool model and the Prisma singleton. Measure or reason about the win. Update `DATABASE.md` if access patterns change. End with the changed-files explanation.

---

## Guardrail cheat-sheet (applies to every prompt)

- Read the six knowledge-base files first; when in doubt, match existing code.
- Financial formulas and constants are frozen unless explicitly requested — ask, don't guess.
- Schema and API changes are additive and signature-preserving.
- No duplicated logic; reuse the engine, helpers, and UI primitives.
- Strict TypeScript, no `any`, `force-dynamic` on APIs, Prisma singleton, TR+EN i18n.
- Always finish by listing and justifying every changed file.
