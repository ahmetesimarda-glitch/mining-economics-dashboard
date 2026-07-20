# ROADMAP.md

> Long-term product and engineering roadmap for the **Mining Economics Dashboard**. This document is grounded in the code that exists today (see `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `DATABASE.md`, `BUSINESS_RULES.md`, `CODING_STANDARDS.md`). Every future item is scoped to be compatible with the current architecture: one Next.js 14 app, a pure calculation engine in `lib/calculations.ts`, Prisma/PostgreSQL persistence, and external Abacus.AI services for AI narrative and PDF export.
>
> **Rule for anyone extending this roadmap:** do not propose anything that breaks the invariants in `BUSINESS_RULES.md` (Year-0 outflow, royalty-on-revenue, tax gating, MUSD scaling, `@@unique([projectId, year])`, cascade deletes) or the layering in `ARCHITECTURE.md`. Additive only.

Complexity is rated **S / M / L / XL**. Priority is **P0 (critical) → P3 (opportunistic)**.

---

## Current Implementation Assessment

### Completed modules (shipped and working)

- **Project CRUD + duplicate** — `app/api/projects/route.ts` (GET list / POST create), `app/api/projects/[id]/route.ts` (GET / PUT / DELETE), `app/api/projects/[id]/duplicate/route.ts`. Create uses nested writes; update uses delete-and-recreate of children.
- **Core economic engine** — `lib/calculations.ts` (cash flow, NPV, IRR, payback, breakeven, revenue). Single source of truth, reused everywhere.
- **Sensitivity analysis** — `app/api/projects/[id]/sensitivity/route.ts`.
- **Economic sensitivity (advanced: spider, switching values, two-way, elasticity)** — `app/api/projects/[id]/economic-sensitivity/route.ts`.
- **Tornado analysis (±20% ranked bars + waterfall)** — `app/api/projects/[id]/tornado/route.ts`.
- **Monte Carlo (2000 iterations, histogram, statistics)** — `app/api/projects/[id]/montecarlo/route.ts`.
- **Environmental / carbon (diesel CO₂, rehabilitation phasing)** — `app/api/projects/[id]/environmental/route.ts`.
- **Financing (PMT annuity, DSCR)** — `app/api/projects/[id]/financing/route.ts`.
- **Operational analysis** — `app/api/projects/[id]/operational/route.ts`.
- **Live market data (metals + FX, 5-min in-memory cache)** — `app/api/market/route.ts`, `app/market/`.
- **AI narrative analysis (streaming SSE, claude-sonnet-4-6)** — `app/api/projects/[id]/ai-analysis/route.ts`, `app/components/ai-analysis-panel.tsx`.
- **Exports** — Excel (`app/api/projects/[id]/xlsx/route.ts`) and PDF (`app/api/projects/[id]/pdf/route.ts` via Abacus HTML2PDF).
- **Multi-project comparison** — `app/compare/`.
- **Bilingual UI (TR/EN)** — `lib/i18n/translations.ts` + provider/hook.
- **Theming (dark default)** — `next-themes`.
- **Master Data — Equipment Catalog** — `EquipmentCatalogItem` + `/api/master-data/equipment` + `/master-data/equipment` UI; project form snapshots into `Equipment`.
- **Two deployment paths** — Abacus managed (`next.config.js`) and self-host/Docker/Railway (`next.config.github.js`, `Dockerfile`, `docker-compose.yml`, `SELF_HOST_GUIDE.md`).

### Partially implemented / has known gaps

- **Input validation** — `zod`/`react-hook-form` are used in forms, but API routes rely on defensive defaulting (`body?.field ?? default`) rather than schema validation at the boundary. *Gap: no single enforced request schema.*
- **Market data caching** — works, but the cache is in-memory per instance (not shared across replicas). *Gap: multi-replica consistency.*
- **Heavy analytics** — Monte Carlo / sensitivity run synchronously in the request. *Gap: latency on large projects; no progress streaming.*
- **Risk register** — the 12-item risk matrix is hardcoded in Turkish (see `BUSINESS_RULES.md`). *Gap: not user-editable, not persisted per project.*
- **Update write path** — children are fully deleted and recreated on every save. *Gap: write amplification; no audit/history.*
- **Documentation kit** — `ai-docs/` now covers context, business rules, DB, architecture, standards; this roadmap, `PROMPTS.md`, and `RELEASE_CHECKLIST.md` complete the first pass.

### Missing capability areas (targets for this roadmap)

- **Enterprise:** no authentication, no authorization, no multi-tenant ownership, no audit log, no project version history.
- **SaaS:** no user accounts, no organizations/teams, no billing/quotas, no sharing/permissions, no per-user dashboards.
- **AI:** single narrative endpoint only — no conversational follow-up, no cached/persisted AI reports, no comparison-level AI, no guardrail that AI never mutates financial numbers.
- **Reporting:** PDF/Excel exist, but no scheduled reports, no branded/templated report builder, no multi-project portfolio report.
- **Database:** no auth tables, no soft-delete/audit columns, no enum promotion, no per-year child timestamps.
- **Performance:** synchronous simulations, in-memory-only cache, full-`include` reads in places, no background job runner.
- **Security:** no auth/rate-limiting/ownership checks; secrets handled correctly but endpoints are effectively open.
- **Testing:** **none** — no unit, integration, or e2e tests and no test runner configured (`jest`/`vitest`/`playwright` absent).

---

## Completed

See “Completed modules” above. These are considered stable and must be protected by every future change. Regressions here are release blockers (see `RELEASE_CHECKLIST.md`).

---

## In Progress

### AI Development Kit (documentation baseline)
- **Purpose:** give AI agents and developers a permanent, repository-specific knowledge base.
- **Business value:** faster, safer onboarding; fewer regressions in financial logic.
- **Complexity:** S. **Dependencies:** none. **Priority:** P0.
- **Status:** `PROJECT_CONTEXT.md`, `BUSINESS_RULES.md`, `DATABASE.md`, `ARCHITECTURE.md`, `CODING_STANDARDS.md` done; `ROADMAP.md` / `PROMPTS.md` / `RELEASE_CHECKLIST.md` being added now.

### API request validation hardening
- **Purpose:** promote defensive defaulting to explicit `zod` schemas at each API boundary without changing accepted shapes.
- **Business value:** predictable errors, fewer silent bad writes, safer AI-generated changes.
- **Complexity:** M. **Dependencies:** none (zod already installed). **Priority:** P1.
- **Order:** early — it is a prerequisite for safe auth and SaaS work.

---

## Short Term

### 1. Test infrastructure bootstrap
- **Purpose:** add a test runner and unit tests for `lib/calculations.ts` (the engine is pure and directly testable).
- **Business value:** locks down the financial invariants so refactors and AI edits cannot silently break NPV/IRR/cash-flow math.
- **Complexity:** M. **Dependencies:** none. **Priority:** P0.
- **Order:** first. Nothing else de-risks the engine as cheaply.

### 2. Persisted AI reports
- **Purpose:** store the last AI narrative per project (additive table or `MiningProject` text column) so reports survive reloads and can be exported.
- **Business value:** reuse expensive AI output; enable AI content in PDF.
- **Complexity:** M. **Dependencies:** validation hardening (input shape). **Priority:** P1.
- **Order:** after tests.

### 3. User-editable, persisted risk register
- **Purpose:** move the hardcoded 12-item risk matrix into a per-project, user-editable model (new child table under `MiningProject`).
- **Business value:** real feasibility studies need project-specific risks.
- **Complexity:** M. **Dependencies:** additive schema migration; keep default seed = current 12 items. **Priority:** P1.
- **Order:** after persisted AI reports.

### 4. Portfolio / multi-project report
- **Purpose:** extend comparison into a single exportable portfolio PDF/Excel.
- **Business value:** decision-makers evaluate portfolios, not single mines.
- **Complexity:** M. **Dependencies:** existing compare + export routes. **Priority:** P2.

---

## Medium Term

### 5. Authentication (Google SSO or credentials)
- **Purpose:** introduce `next-auth` (already installed) with Prisma adapter tables and a `MiningProject.userId` owner relation.
- **Business value:** the single prerequisite for SaaS, sharing, and any public deployment.
- **Complexity:** L. **Dependencies:** additive schema (User/Account/Session/VerificationToken + nullable `userId` backfilled), validation hardening. **Priority:** P0 for any public/SaaS deployment.
- **Order:** first medium-term item; everything SaaS depends on it.
- **Constraint:** additive migration only; existing projects must keep working with a null/owner-backfilled `userId`.

### 6. Authorization & ownership scoping
- **Purpose:** scope all `/api/projects/**` queries to the authenticated owner; block cross-tenant access.
- **Business value:** data isolation — mandatory before multi-user.
- **Complexity:** M. **Dependencies:** authentication. **Priority:** P0 (after auth).

### 7. Background job runner for heavy analytics
- **Purpose:** move Monte Carlo / large sensitivity off the request thread with progress streaming (reuse the existing SSE pattern from AI analysis).
- **Business value:** removes latency ceiling; enables larger simulations.
- **Complexity:** L. **Dependencies:** none architectural, but must not change engine results. **Priority:** P2.
- **Constraint:** the engine stays pure; only the *invocation* becomes async.

### 8. Shared/persistent market cache
- **Purpose:** replace in-memory market cache with a shared cache (DB table or external store) so all replicas serve consistent prices.
- **Business value:** correctness under horizontal scaling.
- **Complexity:** M. **Dependencies:** none. **Priority:** P2.

### 9. Project version history / snapshots
- **Purpose:** persist immutable snapshots of a project + its results at points in time (additive `ProjectSnapshot` table).
- **Business value:** auditability and “what changed” for feasibility reviews.
- **Complexity:** L. **Dependencies:** additive schema; interacts with delete-and-recreate write path. **Priority:** P2.

---

## Long Term

### 10. Underground / multi-method support
- **Purpose:** extend beyond open-pit; the schema already carries `miningMethod` and category-specific `Equipment` fields (e.g. `gallerySuitability`).
- **Business value:** widens addressable use cases.
- **Complexity:** XL. **Dependencies:** engine extensions in `lib/calculations.ts` under explicit rules; new `BUSINESS_RULES.md` sections. **Priority:** P2.
- **Constraint:** open-pit formulas must remain unchanged; new methods are additive branches.

### 11. Configurable Monte Carlo distributions
- **Purpose:** let users choose distributions/volatilities instead of the fixed σ (price 15% / cost 10% / production 8%).
- **Business value:** more realistic, defensible risk modeling.
- **Complexity:** L. **Dependencies:** engine parameterization (defaults must stay identical unless the user overrides). **Priority:** P3.

### 12. Conversational / multi-turn AI advisor
- **Purpose:** follow-up Q&A over a project grounded in computed metrics; possibly an embedded chatbot.
- **Business value:** deeper interpretation without leaving the app.
- **Complexity:** L. **Dependencies:** persisted AI reports, auth. **Priority:** P3.
- **Constraint:** AI is read-only over financials — it must never write NPV/IRR/cash-flow values.

---

## Enterprise Features

### 13. Organizations / teams & sharing
- **Purpose:** org-scoped projects with role-based sharing (viewer/editor/admin).
- **Business value:** team collaboration; core SaaS monetization surface.
- **Complexity:** XL. **Dependencies:** authentication + authorization. **Priority:** P2 (enterprise track).

### 14. Audit logging
- **Purpose:** append-only log of who changed what (create/update/delete, exports, AI runs).
- **Business value:** compliance and traceability for financial decisions.
- **Complexity:** L. **Dependencies:** authentication. **Priority:** P2 (enterprise track).

### 15. Billing, plans & quotas
- **Purpose:** subscription tiers with limits on projects / AI runs / exports (Stripe).
- **Business value:** revenue.
- **Complexity:** XL. **Dependencies:** auth, orgs; follow `get_implementation_guidelines` for Stripe. **Priority:** P3 (enterprise track).

### 16. Rate limiting & abuse protection
- **Purpose:** protect the AI, PDF, and market endpoints (cost and upstream limits).
- **Business value:** cost control and availability.
- **Complexity:** M. **Dependencies:** auth recommended. **Priority:** P2.

### 17. Observability & monitoring
- **Purpose:** structured logging, error tracking, and health metrics beyond `console.error`.
- **Business value:** faster incident response in production.
- **Complexity:** M. **Dependencies:** none. **Priority:** P2.

---

## Nice To Have

- **Enum promotion in Prisma** — turn enum-like `String` fields (`status`, `miningMethod`, `powerType`, `depreciationMethod`) into typed enums. Complexity M, P3. Breaking migration — requires value backfill/validation first.
- **Soft-delete & child timestamps** — additive `deletedAt`/audit columns; keep hard cascade as an option. Complexity M, P3.
- **Scenario library & templates** — saved parameter presets per commodity. Complexity M, P3.
- **Map-driven project entry** — richer use of the installed Leaflet/MapLibre stack for site selection. Complexity M, P3.
- **Additional languages** — extend `lib/i18n/translations.ts` beyond TR/EN. Complexity S, P3.
- **Export theming** — branded PDF templates and Excel styling. Complexity M, P3.

---

## Recommended Implementation Order (consolidated)

1. **Test infrastructure + engine unit tests** (P0, S/M) — protect the financial core first.
2. **API validation hardening** (P1, M) — prerequisite for safe auth/SaaS.
3. **Persisted AI reports** (P1, M) and **user-editable risk register** (P1, M).
4. **Authentication** (P0-for-SaaS, L) → **authorization/ownership** (P0-after-auth, M).
5. **Background jobs for analytics** (P2, L) and **shared market cache** (P2, M).
6. **Portfolio reports** (P2, M), **version history** (P2, L), **rate limiting** (P2, M), **observability** (P2, M).
7. **Enterprise track:** orgs/sharing → audit logging → billing.
8. **Long-term:** underground support, configurable distributions, conversational AI.
9. **Nice-to-haves** as capacity allows.

Each step is additive and preserves the completed modules, the pure calculation engine, and the database invariants. No item on this roadmap requires changing an existing financial formula; where an item touches economics (underground support, configurable distributions), the existing open-pit behavior must remain the untouched default and any change must be driven by an explicit user request and a new `BUSINESS_RULES.md` section.
