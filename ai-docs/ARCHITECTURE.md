# ARCHITECTURE.md

> System architecture reference for the Mining Economics Dashboard. Describes how the application is structured, how requests flow through the layers, and where responsibilities live. Written for senior engineers and AI coding assistants working on this specific repository.

---

## 1. High-Level Architecture

The application is a single **Next.js 14 (App Router)** full-stack web application. It uses:

- **React 18** for the UI (client and server components).
- **Next.js Route Handlers** (`app/api/**/route.ts`) as the backend API layer — there is no separate server process.
- **Prisma 6.7 + PostgreSQL** for persistence.
- **A pure TypeScript calculation engine** (`lib/calculations.ts`) that contains all economic modeling and is completely decoupled from HTTP and the database.
- **External Abacus.AI HTTP APIs** for streaming AI narrative analysis only. PDF export is rendered locally with Puppeteer. No other third-party runtime services are required for core economics.

The result is a self-contained deployable unit: a container that serves both the rendered frontend and the JSON/streaming API from one Node process, talking to one PostgreSQL database.

```
Browser (React client components, charts, maps)
        │  fetch / EventSource
        ▼
Next.js Route Handlers  (app/api/**/route.ts)   ───▶  Abacus.AI (AI analysis) · Local Puppeteer (PDF)
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
- **`app/api/`** — backend Route Handlers. Notable groups: `app/api/projects/` (project CRUD), `app/api/projects/[id]/ai-analysis/` (streaming AI), `app/api/projects/[id]/pdf/` (PDF export), `app/api/market/` (live commodity/FX prices with in-memory caching), `app/api/master-data/equipment|commodity|country/` (Master Data CRUD + ensure).
- **`components/`** — reusable React components: UI primitives under `components/ui/` (shadcn/Radix-based), plus feature components (charts, forms, maps, panels). Prefer extending these over creating new primitives.
- **`lib/`** — framework-agnostic logic: `calculations.ts` (economic engine), `decision-insights.ts` (read-only executive interpretation), `country-intelligence.ts` (jurisdiction reference profiles), `mining-intelligence.ts` (dashboard industry reference briefs; provider-swappable), `dashboard/portfolio-selection.ts` (client portfolio KPI selection), `prisma.ts` (DB client), `market-reference.ts` (catalogs/constants), `master-data/` (equipment/commodity/country types, validation, seeds, `project-defaults.ts` composition, `nav-catalogs.ts`), `i18n/translations.ts` (TR/EN strings), utility helpers.
- **`app/master-data/`** — Master Data page shells (Equipment, Commodity, Country).
- **`components/master-data/`** — reusable Master Data UI pieces (Equipment table/filters/dialog; Commodity/Country clients are page-local for now).
- **`prisma/`** — `schema.prisma` (single source of truth for the data model). See `DATABASE.md`.
- **`scripts/`** — operational scripts: `seed.ts` and `safe-seed.ts` (idempotent seeding, including multi-demo portfolio ensure).
- **`lib/demo/`** — public demo experience: client-safe constants/storage/portfolio-meta, `projects/*` definitions, catalog registry, generic `ensureDemoProject` / `ensureAllDemoProjects`.
- **`components/demo/`** — WelcomeDialog, DemoBadge, DemoPortfolio, DemoProjectCard.
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

- **PDF:** `lib/reports/pdf/` builds a consulting-grade HTML report (cover, TOC, executive summary, project overview, assumptions, economics, equipment, CAPEX/OPEX, production/revenue, cash flow, NPV/IRR/payback/breakeven, sensitivity, Monte Carlo, tornado, financial SVG charts, risk assessment, conclusions, recommendations, disclaimer). `app/api/projects/[id]/pdf/route.ts` orchestrates analysis via the existing engine (`performFullAnalysis`, `sensitivityAnalysis`, `runMonteCarloSimulation`, tornado helper, `generateRiskMatrix`) and renders PDF **locally** with `puppeteer-core` + system Chrome/Chromium (`renderHtmlToPdf`). No Abacus HTML2PDF dependency.
- **Spreadsheet:** `lib/reports/excel/` builds a multi-sheet engineering workbook (Navigation, Project Summary, Economic Inputs, Discount Rate, Commodity Prices, Equipment Investment, Initial Investment, Depreciation, Tire/Fuel/Personnel costs, Government & Forestry, Production, Operating Costs, Revenue, Cash Flow, NPV, IRR, Break-even, Sensitivity, Monte Carlo, Tornado). Served by `app/api/projects/[id]/xlsx/route.ts` via **ExcelJS** (borders, merges, formulas, number formats, freeze panes, print setup, headers/footers). Missing engineering detail is exported as explicit placeholders — never invented.
- **Numbers:** export builders must call the engine / stored results — never re-implement formulas.

---

## 8b. Demo Analytics (pre-auth)

- **Route:** `/internal/demo-analytics` (hidden admin precursor; authentication not yet implemented).
- **Storage:** `DemoAnalyticsEvent` (visitor UUID, event type, optional projectId, path, metadata, timestamp).
- **Client:** `lib/analytics/` — stable visitor UUID in `localStorage`, fire-and-forget `trackAnalyticsEvent`, session bootstrap.
- **API:** `POST /api/internal/analytics/events`, `GET /api/internal/analytics/summary`.
- **Temporary production gate (pre-auth only):** summary page + `GET .../summary` use `isInternalAnalyticsEnabled()` / `INTERNAL_ANALYTICS_ENABLED` (`lib/analytics/gate.ts`). Local `NODE_ENV !== 'production'` remains open for operators. Event ingestion stays available for demo telemetry.
- **Authentication architecture (do not implement as a standalone change):** when Authentication + roles ship, remove the env flag entirely and protect **all** `/internal/*` routes with **Administrator** RBAC — unauthenticated → login redirect; authenticated non-admin → **403** (or authz redirect), never a masked 404; only Administrator may view internal analytics/admin pages. See `ROADMAP.md` §5–§6.

---

## 8c. Location search (GIS-ready)

- **Service:** `lib/location/` normalizes City/State/Country strings and searches Nominatim server-side (`GET /api/location/search`).
- **UI:** compact `LocationSearch` on the existing project form (no form redesign). Selection fills `location` + `latitude`/`longitude`.
- **Map:** `ProjectMap` uses OpenStreetMap raster tiles. Future GIS layers can consume the same normalized fields without schema churn until a dedicated GIS model is added.

---

## 8d. Mining Intelligence (reference panel)

- **Layer:** `lib/mining-intelligence.ts` — typed `MiningIntelligenceItem` / `MiningIntelligenceFeed`, `MiningIntelligenceProvider` interface, and production `StaticMiningIntelligenceProvider` (evergreen educational briefs).
- **UI:** reusable `MiningIntelligenceCard` + dashboard `MiningIntelligencePanel` (`components/mining-intelligence.tsx`) with **Reference Information** badge (never “LIVE” or “Placeholder”).
- **Contract:** cards show Category, Summary, Related Commodities, Last Updated / Content Version. A future live news API implements the same provider interface — UI stays unchanged. Static content must never be presented as live news.

---

## 8e. Decision Insights (read-only interpretation)

- **Service:** `lib/decision-insights.ts` — `generateDecisionInsights(project)` interprets existing outputs only (NPV, IRR, payback, CAPEX, OPEX, initial investment, average annual cash flow, sensitivity series, Monte Carlo stats, commodity/country/mine type/production). Named threshold constants; no calls that recompute economic formulas.
- **API:** `GET /api/projects/[id]/decision-insights` — loads cached project metrics + cash flows, consumes existing sensitivity/`runMonteCarloSimulation` outputs (same read-and-recompute pattern as those analysis routes), returns `DecisionInsight`. Never mutates the project.
- **UI:** `/decision-insights` with recommendation / strength / risk badges, executive summary, advantages, risks, observations. Linked from project detail and header nav.
- **Constraint:** must not change `lib/calculations.ts` formulas or cached economic results.

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

**Containerization:** the multi-stage `Dockerfile` builds on `node:20-alpine`, installs dependencies, runs `prisma generate`, builds the app, runs as a non-root `nextjs` user, exposes port `3000`, and launches with `CMD ["node", "server.js"]` (the standalone server). `docker-compose.yml` wires the app to a `postgres:16-alpine` service (user `mining_user`, database `mining_db`) with a healthcheck and a persistent `pgdata` volume. `.env.example` documents the required `DATABASE_URL`, `NEXTAUTH_URL`, optional `ABACUSAI_API_KEY`, and optional `PUPPETEER_EXECUTABLE_PATH` / `CHROME_PATH` for PDF.

Because the Prisma generator targets both `native` and `linux-musl-arm64-openssl-3.0.x`, the same schema produces a working client on developer machines and inside the Alpine/musl ARM64 container.

---

## 11. Scalability & Operational Notes

- **Stateless app tier.** The Node process holds no session state beyond the short-lived in-memory market cache (`app/api/market/route.ts`, ~5-minute TTL), so the app tier can be scaled horizontally; PostgreSQL is the single source of truth.
- **Compute-on-write.** Heavy analysis (including a 2000-iteration Monte Carlo) runs during the write request and results are cached on `MiningProject`, keeping reads cheap. Adding more per-request recomputation should be weighed against request latency.
- **Connection discipline.** Use the Prisma singleton; assume a limited connection pool and short-lived, ephemeral connections. Avoid long transactions and per-request client construction.
- **Graceful degradation.** The project list endpoint returns an empty array rather than failing, so a transient DB issue degrades the dashboard instead of breaking it.
- **External-service resilience.** AI narrative depends on outbound Abacus.AI calls and is isolated to its own route. PDF rendering is local (Puppeteer) and fails independently of AI/DB.
