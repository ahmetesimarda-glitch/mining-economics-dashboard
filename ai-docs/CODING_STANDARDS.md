# CODING_STANDARDS.md

> Coding standards for the Mining Economics Dashboard, derived from the conventions actually used in this repository. These are the rules senior engineers and AI coding assistants must follow when adding or changing code here. When in doubt, match the surrounding code.

---

## 1. General Principles

- **Match existing patterns.** This is a mature codebase with consistent conventions. Read the neighboring files before writing new code and follow their structure rather than introducing a different style.
- **Keep layers separate.** HTTP concerns live in `app/api/**/route.ts`; economic/domain logic lives in `lib/calculations.ts` and other `lib/` modules; data access goes through `@/lib/prisma`. Do not blur these boundaries (no Prisma calls inside the calculation engine, no business math inside components).
- **Single source of truth.** Business rules live once, in the calculation engine, and are reused by every caller. Never re-implement NPV/IRR/cash-flow logic in a route or a component.
- **Production-ready only.** No placeholder code, dead code, commented-out blocks, or TODO stubs in committed work.
- **Prefer additive change.** Especially for the schema and shared types — extend rather than break existing shapes.

---

## 2. TypeScript

- **Strict mode is on** (`tsconfig.json`: `strict: true`, target `es2020`, `moduleResolution: bundler`, `jsx: preserve`, `noEmit`). Write code that type-checks cleanly under strict settings.
- **Build enforces types.** The GitHub/self-host build sets `typescript.ignoreBuildErrors: false`, so type errors break the build — do not rely on them being ignored.
- **Use the `@/*` path alias.** Import from `@/lib/...`, `@/components/...`, `@/hooks/...` rather than long relative paths.
- **Export and reuse domain types.** Types such as `ProjectParams`, `CashFlowRow`, `AnalysisResult`, and `ScenarioResult` are defined in `lib/calculations.ts` — import them; do not redefine parallel shapes.
- **Avoid `any`.** Prefer precise types or well-scoped generics. When narrowing untrusted input, default defensively (`value ?? fallback`) with the correct type.

---

## 3. React Components

- **Server vs client.** Default to server components; add `"use client"` only when the component needs state, effects, browser APIs, or event handlers.
- **Guard browser-only libraries.** Charting (`recharts`, `chart.js`, `plotly.js`) and mapping (`leaflet`, `maplibre-gl`) touch `window`/`document` and must run client-side only; never access browser globals during SSR.
- **Reuse UI primitives.** Build on the existing `components/ui/` primitives (Radix/shadcn-based) and feature components instead of creating new one-off primitives. Consult `STYLE_GUIDE.md`.
- **Deterministic render.** Do not use `Math.random()`, `Date.now()`, or `new Date()` in render, state initialization, or default props — this causes hydration mismatches. Move nondeterministic values into effects or pass them from the server.
- **Contrast & interactivity.** Every button/dropdown must have readable contrast and a real handler — no non-functional controls.

---

## 4. Next.js

- **App Router only.** New pages and endpoints use the `app/` directory conventions.
- **`force-dynamic` on runtime-dependent code.** Every Route Handler and any page that reads live DB state or runtime environment variables (e.g. `process.env.NEXTAUTH_URL`, `process.env.ABACUSAI_API_KEY`) must set `export const dynamic = "force-dynamic";`.
- **Never expose secrets to the client.** Read API keys and secrets only in server code (route handlers / server components). Do not place them in client components or `NEXT_PUBLIC_*` variables.
- **Respect the two build configs.** Do not introduce config that breaks either `next.config.js` (managed/preview) or `next.config.github.js` (self-host standalone).

---

## 5. Prisma & Data Access

- **Always use the singleton.** Import `@/lib/prisma`; never instantiate `new PrismaClient()` in a route or component.
- **Compute derived values before writing.** Follow the established pattern: `Equipment.totalCost = (quantity + spareQuantity) * unitCost`, `Personnel.annualCost = count * monthlySalary * 12`, `ByProduct.totalRevenue = annualProduction * unitPrice`, and recompute `totalCapex`/`totalOpex`/analysis results on every write.
- **Nested writes for aggregates.** Create a `MiningProject` with nested `create` for its children in one call; on update, follow the existing delete-and-recreate strategy for child collections.
- **Filter empty rows.** Persist only meaningful rows (e.g. `MethodSpecificCost` requires a non-empty `name`).
- **Select narrowly.** Prefer `select` of needed scalar fields over full `include` on list/benchmark queries.
- **Schema safety.** Make additive, backward-compatible schema changes. Never run `prisma db push --accept-data-loss` or `--force-reset` against the shared database without explicit approval.
- **Connections are ephemeral.** Do not hold long transactions or rely on session state.

---

## 6. API Conventions

- **Structure:** parse body → defensively default fields → delegate math to `lib/calculations.ts` → persist via Prisma → shape the response. Keep handlers thin.
- **Validation:** the current codebase uses defensive defaulting (`body?.field ?? default`) rather than schema validation in project routes. Match this; if you introduce `zod`/`yup` validation, apply it consistently at the API boundary and keep error responses in the existing shape.
- **Error handling:** wrap in `try/catch`; on error, log `console.error('<context>:', error)` and return the conventional JSON — `404 { error: 'Proje bulunamadı' }` when a resource is missing, `500 { error: <message> }` on failure. Preserve graceful-degradation behavior where it exists (the projects list returns `[]` with HTTP 200 on error).
- **Streaming:** for AI responses, return a `ReadableStream` with `Content-Type: text/event-stream; charset=utf-8`, following the existing `ai-analysis` handler.

---

## 7. Naming Conventions

- **Files:** React components in `PascalCase.tsx`; `lib/` modules and utilities in `kebab-case.ts` or `camelCase.ts` consistent with existing files; Route Handlers are always `route.ts` within a descriptive folder.
- **Symbols:** `PascalCase` for React components and TypeScript types/interfaces; `camelCase` for variables, functions, and object fields (this matches the Prisma field names, e.g. `annualProduction`, `strippingUnitCost`); `UPPER_SNAKE_CASE` for module-level constants (e.g. `EQUIPMENT_REFERENCE`, `EMISSION_FACTORS`, `COMMODITY_REFERENCE` in `lib/market-reference.ts`).
- **Enum-like strings:** keep the existing literal values (`"openPit"`, `"active"`, `"diesel"`, `"linear"`, etc.) exactly — they are persisted as plain strings and compared by value.

---

## 8. Error Handling & Logging

- **Contextual logs.** Use `console.error` with a short context prefix so failures are traceable in server logs.
- **Never swallow silently.** Either handle an error meaningfully (e.g. graceful list degradation) or surface it as a proper HTTP error; do not catch-and-ignore.
- **User-facing messages.** Keep user-facing API error copy consistent with existing conventions (Turkish messages like `'Proje bulunamadı'` where already used).
- **External calls.** For Abacus.AI AI/PDF calls, handle non-success statuses and timeouts explicitly (the PDF route polls for `SUCCESS`/`FAILED`/timeout; follow that pattern for new async external calls).

---

## 9. Security

- **Secrets stay server-side.** `ABACUSAI_API_KEY` and any credentials are read from `process.env` in server code only and never logged or returned to the client.
- **No secrets in the repo.** Use `.env` (documented via `.env.example`); never hardcode connection strings or keys.
- **Validate/normalize untrusted input** at the API boundary before it reaches the database or the calculation engine.
- **Least exposure.** Do not add endpoints that leak internal fields or other projects' data; scope queries to the requested resource.

---

## 10. Performance

- **Compute once, cache on write.** Follow the compute-on-write pattern; avoid recomputing heavy analysis (e.g. the 2000-iteration Monte Carlo) on read paths.
- **Query efficiently.** Use indexed fields (`status`, `projectId`) for filtering; avoid unnecessary `include` fan-out; select only needed columns.
- **Cache external/live data.** Follow the market route's short-TTL in-memory cache pattern for volatile external data instead of hammering upstream APIs.
- **Client bundle.** Import heavy visualization libraries only in the client components that need them.

---

## 11. Accessibility

- **Semantic markup and labels.** Use appropriate elements and associate labels with form controls; provide meaningful, descriptive `alt` text on images (never generic text).
- **Contrast.** Maintain readable contrast in both light and dark themes (the app uses `next-themes`); never use low-contrast combinations such as light text on light backgrounds.
- **Keyboard support.** Ensure interactive components (built on Radix primitives) remain keyboard-navigable and focus-visible.

---

## 12. Documentation

- **Keep `ai-docs/` current.** When you change the schema, business rules, architecture, or conventions, update the relevant file in `ai-docs/` (`DATABASE.md`, `BUSINESS_RULES.md`, `ARCHITECTURE.md`, `PROJECT_CONTEXT.md`, this file) in the same change.
- **Explain the “why”.** Comment non-obvious economic logic and reference `BUSINESS_RULES.md` rather than restating formulas in multiple places.
- **Localized copy.** Add user-facing strings to `lib/i18n/translations.ts` (TR/EN) instead of hardcoding them in components.

---

## 13. Testing & Verification

- **Type + build check.** Because the self-host build enforces TypeScript errors, ensure `tsc`/the build passes before considering a change done.
- **Exercise real paths.** For behavior changes, run the actual code path (e.g. call the relevant API route) and verify output against `BUSINESS_RULES.md`; reading code alone is not verification.
- **Test the engine directly.** `lib/calculations.ts` is pure and can be exercised in isolation — prefer verifying economic changes at that level with representative inputs.
- **Idempotent seeds.** Any change to `scripts/seed.ts` / `scripts/safe-seed.ts` must remain idempotent (upserts, no destructive deletes) so it is safe against shared data.

---

## 14. Forbidden Practices

- Do **not** instantiate `new PrismaClient()` outside `lib/prisma.ts`.
- Do **not** put business/economic math in components or route handlers — it belongs in `lib/calculations.ts`.
- Do **not** run `prisma db push --accept-data-loss` or `--force-reset` on the shared database without explicit approval.
- Do **not** expose secrets to the client or log them.
- Do **not** use nondeterministic values (`Math.random()`, `Date.now()`, `new Date()`) in render/state init — it breaks hydration.
- Do **not** access `window`/`document` during SSR.
- Do **not** hardcode user-facing strings that should be localized, or hardcode values that already exist as constants in `lib/market-reference.ts`.
- Do **not** introduce breaking schema or shared-type changes when an additive change is possible.
- Do **not** duplicate business rules across layers — reuse the single source of truth.
