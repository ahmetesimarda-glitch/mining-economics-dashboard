# PROJECT CONTEXT — Mining Economics Dashboard

> **Purpose of this document**: This is the single source of truth for understanding the architecture, purpose, and structure of the Mining Economics Dashboard. **Read this file completely before making any change to the codebase.** It is written for both human developers and AI coding assistants (Cursor, etc.).

---

## 1. Project Overview

The **Mining Economics Dashboard** is a full-stack web application for the **techno-economic feasibility analysis of open-pit mining projects**. It lets a user create a mining project, enter detailed economic / technical / environmental / financing parameters, and instantly obtain a complete financial evaluation: cash-flow projection, NPV, IRR, payback period, breakeven price, sensitivity analysis, Monte Carlo risk simulation, tornado diagrams, environmental (carbon) analysis, financing (loan) analysis, and AI-generated narrative analysis. Results can be exported to Excel and PDF.

### Vision & Purpose
- Give mining engineers and students a **single tool** to model the entire economic life of a mine, from CAPEX to closure/rehabilitation.
- Replace fragile, one-off spreadsheets with a **reproducible, versioned, server-side calculation engine** where every result is derived from the same audited formulas.
- Make advanced financial risk techniques (Monte Carlo, sensitivity, tornado) accessible through a clean UI.
- Provide **live commodity & FX market data** as a reference for pricing assumptions.

### Primary Users
Mining engineering students and professionals performing feasibility studies. The default seeded content and terminology are in **Turkish**, and the UI supports both **Turkish (TR)** and **English (EN)**.

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 14.2.28** (App Router) |
| Language | **TypeScript 5.2** (`strict: true`) |
| UI runtime | **React 18.2** |
| Styling | **Tailwind CSS 3.3**, `tailwindcss-animate`, custom design tokens |
| Component primitives | **Radix UI** (accordion, dialog, dropdown, tabs, select, etc.) via a local `components/ui` layer |
| Icons | `lucide-react` |
| Charts | **Recharts**, **Chart.js** (`react-chartjs-2`), **Plotly.js** (`react-plotly.js`) |
| Maps | **Leaflet** / `react-leaflet`, `maplibre-gl` |
| ORM / DB | **Prisma 6.7** + **PostgreSQL** |
| Animation | **Framer Motion** |
| Theming | **next-themes** (dark theme is the default) |
| Excel export | **`xlsx`** (SheetJS) |
| PDF export | **Abacus HTML2PDF API** (external HTTP service; no local headless browser) |
| AI analysis | **Abacus RouteLLM API** (OpenAI-compatible `chat/completions`, model `claude-sonnet-4-6`, streaming SSE) |
| Live market data | `gold-api.com` (metals) + `open.er-api.com` (FX) |
| Forms / validation | `react-hook-form`, `zod` |
| Internationalization | Custom lightweight i18n in `lib/i18n/` (no external i18n framework) |
| Package manager | **yarn** (primary) |

> **Do not upgrade to Next.js 15 / React 19.** The build & deploy pipeline supports Next.js 14 only.

---

## 3. Folder Structure

```
nextjs_space/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout: fonts, ThemeProvider (dark default), i18n provider, chat script
│   ├── page.tsx                  # Home → renders DashboardClient
│   ├── globals.css               # Tailwind base + design tokens
│   ├── market/                   # Live market data page (MarketClient)
│   ├── compare/                  # Multi-project comparison page
│   ├── projects/
│   │   ├── new/                  # Create-project form
│   │   └── [id]/
│   │       ├── project-detail-client.tsx   # Main project detail view (~1400 lines)
│   │       └── edit/             # Edit-project form
│   └── api/                      # All backend route handlers (see §6)
│       ├── market/route.ts
│       └── projects/
│           ├── route.ts          # GET list / POST create
│           └── [id]/
│               ├── route.ts      # GET / PUT / DELETE
│               ├── sensitivity/route.ts
│               ├── economic-sensitivity/route.ts
│               ├── tornado/route.ts
│               ├── montecarlo/route.ts
│               ├── environmental/route.ts
│               ├── financing/route.ts
│               ├── operational/route.ts
│               ├── ai-analysis/route.ts
│               ├── duplicate/route.ts
│               ├── xlsx/route.ts
│               └── pdf/route.ts
├── components/
│   ├── ui/                       # Radix-based reusable primitives (button, card, dialog, tabs, ...)
│   ├── master-data/equipment/    # Equipment Catalog UI pieces (table, filters, dialog, form)
│   ├── header.tsx                # App header / navigation
│   ├── project-card.tsx          # Project list card
│   ├── ai-analysis-panel.tsx     # AI analysis UI (streaming)
│   └── theme-provider.tsx        # next-themes wrapper
├── lib/
│   ├── calculations.ts           # ★ CORE FINANCIAL ENGINE — all economic formulas
│   ├── market-reference.ts       # Equipment price refs, emission factors, commodity references
│   ├── prisma.ts                 # Prisma client singleton
│   ├── utils.ts                  # cn() and shared helpers
│   ├── types.ts                  # Shared TS types
│   ├── i18n/                     # translations.ts (TR/EN) + provider/hook
│   └── master-data/              # types, mapper, validation, seed (catalog kinds registry)
├── prisma/
│   ├── schema.prisma             # MiningProject aggregate + EquipmentCatalogItem
│   └── migrations/               # Prisma Migrate history
├── scripts/                      # Seed / utility scripts
├── public/                       # Static assets
├── types/                        # Ambient type declarations
├── next.config.js                # Abacus build config (standalone output driven by env)
├── next.config.github.js         # Alternate config for self-host/GitHub build
├── Dockerfile / docker-compose.yml  # Self-hosting artifacts
└── tsconfig.json                 # strict: true
```

> **Preserve this structure.** Do not relocate the calculation engine, API route files, or Prisma schema. The folder conventions are load-bearing for both the Abacus build and the GitHub/Docker self-host path.

Master Data UI/API live under `app/master-data/**` and `app/api/master-data/**`. Only the Equipment catalog is implemented; other catalog kinds are reserved in `lib/master-data/catalog-kinds.ts`.

---

## 4. Main Features / Modules

1. **Dashboard** (`app/page.tsx` → `DashboardClient`): lists all projects with headline metrics (NPV, IRR, status), entry point to create / open / compare projects.
2. **Project CRUD** (`app/projects/*`, `/api/projects/*`): create, edit, view, delete, and **duplicate** a mining project with ~90 economic/technical parameters plus child collections (CAPEX items, OPEX items, equipment, personnel, by-products, method-specific costs).
3. **Economic Analysis** (`lib/calculations.ts`): server-side computation of full year-by-year cash flow, NPV, IRR, payback period, breakeven price. Recomputed on every create/update.
4. **Sensitivity Analysis** (`/api/projects/[id]/sensitivity`): NPV/IRR response to ± variation of key drivers.
5. **Economic Sensitivity (advanced)** (`/api/projects/[id]/economic-sensitivity`): spider chart, switching values, two-way tables, summary, and elasticity.
6. **Tornado Analysis** (`/api/projects/[id]/tornado`): ranked ±20% impact bars plus a waterfall breakdown.
7. **Monte Carlo Simulation** (`/api/projects/[id]/montecarlo`): 2000-iteration probabilistic NPV distribution with histogram and statistics.
8. **Environmental Analysis** (`/api/projects/[id]/environmental`): diesel-based CO₂ carbon footprint and rehabilitation phasing.
9. **Financing Analysis** (`/api/projects/[id]/financing`): loan amortization (PMT annuity) and DSCR.
10. **Operational Analysis** (`/api/projects/[id]/operational`): operational/production-oriented breakdown.
11. **Market Data** (`app/market`, `/api/market`): live metal prices and FX rates with 5-minute caching.
12. **AI Analysis** (`/api/projects/[id]/ai-analysis`, `ai-analysis-panel.tsx`): streaming LLM-generated narrative feasibility assessment.
13. **Comparison** (`app/compare`): side-by-side comparison of multiple projects.
14. **Exports**: **Excel** (`/api/projects/[id]/xlsx`) and **PDF** (`/api/projects/[id]/pdf`).
15. **Internationalization**: full TR/EN switching via `lib/i18n`.
16. **Master Data — Equipment Catalog** (`/master-data/equipment`, `/api/master-data/equipment`): CRUD catalog with search/filter/pagination; project form can snapshot items into the fleet.

---

## 5. Data Model (Prisma)

See `prisma/schema.prisma` for the authoritative definitions. Eight models:

- **`MiningProject`** — the root aggregate (~90 fields): identity/metadata, economic parameters (discount rate, tax rate, royalty rate, credit terms, unit price, annual production, project life…), CAPEX/OPEX summary fields, environmental parameters, financing parameters, geographic coordinates, and **stored calculated results** (NPV, IRR, payback, etc.). Indexed on `status`.
- **`CashFlowYear`** — one row per project year; `@@unique([projectId, year])`. Stores revenue, costs, depreciation, tax, net & discounted cash flow.
- **`CapexItem`** — individual capital expenditure line items.
- **`OpexItem`** — individual operating expenditure line items.
- **`Equipment`** — detailed equipment technical parameters (fuel, power, electric flag, etc.).
- **`Personnel`** — staffing records.
- **`ByProduct`** — by-product revenue contributors.
- **`MethodSpecificCost`** — mining-method-specific cost items.
- **`EquipmentCatalogItem`** — Master Data equipment catalog (standalone; not cascade-owned by a project). Seeded from `EQUIPMENT_REFERENCE`; projects snapshot into `Equipment`.

All child models of `MiningProject` reference it and **cascade-delete** when the parent project is deleted. `projectId` is indexed on child tables.

---

## 6. Application & Data Flow

### Create / Update flow
1. User submits the project form (`app/projects/new` or `.../edit`).
2. `POST /api/projects` (or `PUT /api/projects/[id]`) receives the payload.
3. On **PUT**, the handler **deletes and recreates all child collections** (cash-flow years, CAPEX, OPEX, equipment, personnel, by-products, method costs) inside the update — do not assume child rows are diff-merged.
4. The server calls the calculation engine in `lib/calculations.ts` to recompute the full economic analysis (cash flow → NPV → IRR → payback → breakeven) **server-side**.
5. Calculated results and regenerated `CashFlowYear` rows are persisted back to the database.
6. The client re-fetches and renders charts/metrics.

### Analysis-on-demand flow
Sensitivity, economic-sensitivity, tornado, Monte Carlo, environmental, financing, and operational analyses are computed on request by their respective API routes, all reusing the shared engine in `lib/calculations.ts`. **They read the stored project, recompute, and return JSON — they do not mutate the project.**

### AI flow
`POST /api/projects/[id]/ai-analysis` builds a prompt from the project + computed metrics, calls the Abacus RouteLLM API with streaming enabled, and pipes an SSE stream to the client. It includes JSON-repair logic to tolerate partial/malformed streamed JSON.

### Market flow
`GET /api/market` fetches live metals + FX, caches results in-memory for 5 minutes, and serves the reference data to the Market page and pricing helpers.

> **Every API route sets `export const dynamic = "force-dynamic"`.** Preserve this — the app depends on runtime environment values and live data, not static build-time snapshots.

---

## 7. Deployment

The app supports two deployment paths:

1. **Abacus platform (primary)** — built to a standalone output driven by `NEXT_OUTPUT_MODE`, deployed to the hosted preview/production URL. `next.config.js` is the Abacus config.
2. **Self-hosting (GitHub + Docker/Railway)** — `next.config.github.js`, `Dockerfile`, and `docker-compose.yml` support building and running the app independently. See `SELF_HOST_GUIDE.md` for the step-by-step self-host process.

Database connectivity is provided via `DATABASE_URL` (see `.env.example`). The AI, PDF, and market features require the corresponding API keys / outbound network access in the target environment.

---

## 8. Strengths

- **Single audited calculation engine** — every module reuses `lib/calculations.ts`, so results are internally consistent.
- **Server-side computation** — results are reproducible and not dependent on client state.
- **Comprehensive risk tooling** — sensitivity, tornado, and Monte Carlo in one product.
- **Strict TypeScript** end-to-end with a typed Prisma data layer.
- **Bilingual (TR/EN)** and themable (dark default).
- **Two deployment paths** (managed + self-host).

## 9. Known Limitations

- Monte Carlo / analytics run **synchronously in the request** (2000 iterations); very large projects add latency.
- Market data cache is **in-memory** (per server instance), not shared across replicas.
- On project **update**, child rows are fully **recreated** rather than diffed.
- The risk matrix is a **hardcoded** 12-item Turkish list, not user-editable.
- AI and PDF features depend on **external services** and will degrade if those are unavailable.

## 10. Future Expansion Ideas

- Move heavy simulations to background jobs / streaming progress.
- User-editable risk register and configurable distributions for Monte Carlo.
- Shared/persistent caching for market data.
- Scenario snapshots / version history per project.
- Underground (non-open-pit) mining method support.

---

## 11. Developer Onboarding (Quick Start)

1. **Read this file, then `ai-docs/BUSINESS_RULES.md`, then `.cursor/rules/mining-dashboard.mdc`.**
2. Install deps with **yarn**; set `DATABASE_URL` (copy from `.env.example`).
3. Run `yarn prisma generate` (and migrate/seed as needed via `scripts/`).
4. Start the dev server (`yarn dev`).
5. To understand any economic number on screen, trace it back to a function in `lib/calculations.ts` — that is always the source of truth.
6. Before touching any financial formula, read the corresponding rule in `BUSINESS_RULES.md`. **Never change a formula without an explicit user request.**