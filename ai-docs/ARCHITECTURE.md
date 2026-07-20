# ARCHITECTURE.md

> System architecture reference for the Mining Economics Dashboard. Describes how the application is structured, how requests flow through the layers, and where responsibilities live. Written for senior engineers and AI coding assistants working on this specific repository.

---

## 1. High-Level Architecture

The application is a single **Next.js 14 (App Router)** full-stack web application. It uses:

- **React 18** for the UI (client and server components).
- **Next.js Route Handlers** (`app/api/**/route.ts`) as the backend API layer — there is no separate server process.
- **Prisma 6.7 + PostgreSQL** for persistence.
- **A pure TypeScript calculation engine** (`lib/calculations.ts`) that contains all economic modeling and is completely decoupled from HTTP and the database.
- **External Abacus.AI HTTP APIs** for two features only: streaming AI narrative analysis (chat completions) and HTML-to-PDF export. No other third-party runtime services are required.

The result is a self-contained deployable unit: a container that serves both the rendered frontend and the JSON/streaming API from one Node process, talking to one PostgreSQL database.

```
Browser (React client components, charts, maps)
        │  fetch / EventSource
        ▼
Next.js Route Handlers  (app/api/**/route.ts)   ───▶  Abacus.AI APIs (AI analysis, HTML→PDF)
        │                                                (outbound HTTPS only)
        ├──▶  Calculation engine (lib/calculations.ts, pure TS)
        └──▶  Prisma singleton (lib/prisma.ts)  ───▶  PostgreSQL
```

---

## 2. Layered Architecture

The codebase follows a clear layering, even though it lives in one Next.js project:

1. **Presentation layer** — React components under `app/` (pages) and `components/`. Renders forms, tables, charts, and maps; talks to the API layer via `fetch`.
2. **API layer** — Route Handlers under `app/api/`. Responsible for HTTP concerns: parsing/validating input, defensive defaulting, orchestration, and response shaping. Every handler is `export const dynamic = "force-dynamic"`.
3. **Domain / business-logic layer** — `lib/calculations.ts` and supporting `lib/` modules. Pure functions with no knowledge of HTTP or Prisma. This is where NPV, IRR, cash flows, sensitivity, Monte Carlo, emissions, and scenario logic live.
4. **Data-access layer** — `lib/prisma.ts` (the singleton client) plus the Prisma schema. The API layer is the only layer that touches Prisma directly.
5. **Reference-data layer** — `lib/market-reference.ts`, `lib/i18n/translations.ts`, and similar static modules that provide catalog defaults and localized strings.

The key architectural rule is that **business logic never imports Prisma or `next/*`**, and the calculation engine can be unit-tested in isolation. The API layer is the seam that wires HTTP ↔ domain ↔ database together.

---

## 3. Folder Responsibilities

- **`app/`** — App Router routes. Page routes (server/client components) render the dashboard UI; `app/layout.tsx` provides the root layout (including the Abacus app script and theme provider) and `app/globals.css` holds global styles.
- **`app/api/`** — backend Route Handlers. Notable groups: `app/api/projects/` (project CRUD), `app/api/projects/[id]/ai-analysis/` (streaming AI), `app/api/projects/[id]/pdf/` (PDF export), `app/api/market/` (live commodity/FX prices with in-memory caching), `app/api/master-data/equipment/` (Equipment Catalog CRUD).
- **`components/`** — reusable React components: UI primitives under `components/ui/` (shadcn/Radix-based), plus feature components (charts, forms, maps, panels). Prefer extending these over creating new primitives.
- **`lib/`** — framework-agnostic logic: `calculations.ts` (economic engine), `prisma.ts` (DB client), `market-reference.ts` (catalogs/constants), `master-data/` (`types.ts`, `mapper.ts`, `validation.ts`, seed builders), `i18n/translations.ts` (TR/EN strings), utility helpers.
- **`app/master-data/`** — Master Data page shells (Equipment Catalog first).
- **`components/master-data/`** — reusable Master Data UI pieces (`EquipmentTable`, `EquipmentCardGrid`, `EquipmentFilters`, `EquipmentDetailDrawer`, `EquipmentDialog`, …).
- **`prisma/`** — `schema.prisma` (single source of truth for the data model). See `DATABASE.md`.
- **`scripts/`** — operational scripts: `seed.ts` and `safe-seed.ts` (idempotent seeding).
- **`hooks/`** — shared React hooks (e.g. `use-toast`).
- **`types/`** — ambient/shared TypeScript type declarations.
- **Root config** — `next.config.js` (Abacus/preview build), `next.config.github.js` (standalone/self-host build), `tailwind.config.ts`, `tsconfig.json`, `Dockerfile`, `docker-compose.yml`, `.env.example`.

---

## 4. API Layer

- **Runtime:** every Route Handler declares `export const dynamic = "force-dynamic"` to opt out of static optimization and always run per-request (essential because responses depend on live DB state and runtime environment variables).
- **Input handling:** handlers read the JSON body and apply **defensive defaulting** (`body?.field ?? default`) rather than schema-enforced validation. Although `zod` and `yup` are installed, the project routes rely on defaulting and application logic; if stricter validation is introduced it should be added consistently at the API boundary.
- **Orchestration:** the create/update flow computes all derived values and runs `performFullAnalysis` before writing, then persists the project and children via a single nested Prisma call. Business rules are never duplicated in the handler — they are delegated to `lib/calculations.ts`.
- **Error handling:** handlers wrap work in `try/catch`, log with a contextual prefix via `console.error('<context>:', error)`, and return JSON errors. Conventions observed: `404` with `{ error: 'Proje bulunamadı' }` when a project is missing, `500` with `{ error: <message> }` on failure. The projects **list** endpoint intentionally degrades to an empty array with HTTP 200 on error.
- **Responses:** standard endpoints return JSON. The AI-analysis endpoint returns a streamed `text/event-stream` response (see below).

---

## 5. Business Logic Layer

`lib/calculations.ts` (~1000 lines) is the heart of the system and is intentionally free of I/O. It exports both the domain types and the functions:

- **Types:** `ProjectParams`, `CashFlowRow`, `AnalysisResult`, `OperationalMetrics`, `FuelAnalysisItem`, `MaintenanceAnalysisItem`, `PersonnelProductivityItem`, `ScenarioResult`.
- **Functions:** `calculateTotalCapex`, `calculateTotalOpex`, `calculateAnnualRevenue`, `calculateCashFlows`, `performFullAnalysis`, `sensitivityAnalysis`.

The economic semantics (Year-0 outflow, royalty basis, tax gating, discounting, IRR bisection, Monte Carlo parameters, emissions factors, rehabilitation phasing, risk matrix, scenario multipliers, financing/DSCR) are specified in `BUSINESS_RULES.md`. Because this layer is pure, the same functions are reused by the CRUD routes (to compute and cache results) and by the AI-analysis route (to compute elasticities via `sensitivityAnalysis`).

---

## 6. Database Layer

- **Access:** exclusively through the Prisma singleton in `lib/prisma.ts`, imported as `@/lib/prisma`. The singleton is cached on `globalThis` in non-production to prevent connection exhaustion during hot reload.
- **Model:** one root aggregate (`MiningProject`) with seven cascade-deleted child collections. Full details in `DATABASE.md`.
- **Write strategy:** create uses nested `create`; update uses delete-and-recreate of child rows. Derived totals and cached analysis results are always recomputed on write so persisted state matches a fresh model run.
- **Connection assumptions:** connections are short-lived; no reliance on persistent session state or long transactions.

---

## 7. Rendering Strategy

- **App Router + React 18.** Server components handle data-bearing shells; interactive pieces (forms, charts, maps, live market widgets) are client components.
- **Force-dynamic where runtime state matters.** API routes and any page reading runtime environment values are dynamic; nothing that depends on live DB or env is statically cached at build time.
- **Theming.** `next-themes` provides light/dark theming through a provider mounted in the root layout; `framer-motion` powers UI animation.
- **Visualization stack.** Charts use `recharts`, `chart.js` (+ `react-chartjs-2`), and `plotly.js` (+ `react-plotly.js`); geospatial views use `leaflet`/`react-leaflet` and `maplibre-gl`. These are client-only and must be guarded from SSR access to `window`.
- **Localization.** `lib/i18n/translations.ts` holds TR/EN strings; user-facing copy is looked up rather than hardcoded.

---

## 8. Export Subsystem (PDF & Spreadsheet)

- **PDF:** `app/api/projects/[id]/pdf/route.ts` builds an HTML report and calls the Abacus.AI HTML-to-PDF service. It POSTs to `createConvertHtmlToPdfRequest` to obtain a `request_id`, then polls `getConvertHtmlToPdfStatus` until the status is `SUCCESS` (the base64 `result` is decoded to a Buffer and returned as a PDF), `FAILED`, or a timeout is reached. This offloads headless-browser rendering, which is unavailable in the production runtime.
- **Spreadsheet:** `xlsx` is available for Excel import/export of project data.

---

## 9. AI Integration

- **Endpoint:** `app/api/projects/[id]/ai-analysis/route.ts` builds a `ProjectParams` object via `buildProjectParams(project)`, computes parameter elasticities with `sensitivityAnalysis` over a [-10, +10] range for keys such as price, capex, opex, discountRate, oreGrade, exchangeRate, and fuelPrice, and gathers peer benchmarks with a scalar-only `select` query.
- **Model call:** it POSTs to `https://apps.abacus.ai/v1/chat/completions` with `Authorization: Bearer ${process.env.ABACUSAI_API_KEY}`, model `claude-sonnet-4-6`, and `stream: true`.
- **Streaming:** the handler returns a `ReadableStream` with `Content-Type: text/event-stream; charset=utf-8`, forwarding tokens to the client as they arrive. A `finalizeBuffer` step repairs/normalizes the JSON payload at stream end.
- **Key management:** the API key is read from the environment on the server only and is never exposed to the client.

---

## 10. Deployment Architecture

The repository supports two build targets:

- **Abacus / preview build (`next.config.js`):** `distDir` from `NEXT_DIST_DIR`, `output` from `NEXT_OUTPUT_MODE` (standalone in the managed pipeline), `images.unoptimized: true`, `eslint.ignoreDuringBuilds: true`, `typescript.ignoreBuildErrors: false`, custom webpack chunk filenames, and `experimental.outputFileTracingRoot` for the standalone trace.
- **Self-host / GitHub build (`next.config.github.js`):** `output: 'standalone'`, unoptimized images, eslint ignored during build, TypeScript build errors enforced.

**Containerization:** the multi-stage `Dockerfile` builds on `node:20-alpine`, installs dependencies, runs `prisma generate`, builds the app, runs as a non-root `nextjs` user, exposes port `3000`, and launches with `CMD ["node", "server.js"]` (the standalone server). `docker-compose.yml` wires the app to a `postgres:16-alpine` service (user `mining_user`, database `mining_db`) with a healthcheck and a persistent `pgdata` volume. `.env.example` documents the required `DATABASE_URL`, `NEXTAUTH_URL`, and optional `ABACUSAI_API_KEY` / `HTML2PDF_API_URL`.

Because the Prisma generator targets both `native` and `linux-musl-arm64-openssl-3.0.x`, the same schema produces a working client on developer machines and inside the Alpine/musl ARM64 container.

---

## 11. Scalability & Operational Notes

- **Stateless app tier.** The Node process holds no session state beyond the short-lived in-memory market cache (`app/api/market/route.ts`, ~5-minute TTL), so the app tier can be scaled horizontally; PostgreSQL is the single source of truth.
- **Compute-on-write.** Heavy analysis (including a 2000-iteration Monte Carlo) runs during the write request and results are cached on `MiningProject`, keeping reads cheap. Adding more per-request recomputation should be weighed against request latency.
- **Connection discipline.** Use the Prisma singleton; assume a limited connection pool and short-lived, ephemeral connections. Avoid long transactions and per-request client construction.
- **Graceful degradation.** The project list endpoint returns an empty array rather than failing, so a transient DB issue degrades the dashboard instead of breaking it.
- **External-service resilience.** AI and PDF features depend on outbound Abacus.AI calls; both are isolated to their own routes so a failure there does not affect core CRUD or analysis.
