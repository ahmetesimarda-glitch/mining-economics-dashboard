# AGENTS.md

## Cursor Cloud specific instructions

This is a Next.js 14 (App Router) + Prisma + PostgreSQL app — a mining economic
feasibility analysis dashboard (UI in Turkish). Standard commands live in
`package.json` (`dev`, `build`, `start`, `lint`) and setup steps are in `README.md`
/ `SELF_HOST_GUIDE.md`.

The update script runs `npm install` and `npx prisma generate` on startup. The
notes below cover things that are NOT automated by that script.

### Database (PostgreSQL) — must be started manually each boot
- PostgreSQL 16 is installed via apt and a `mining_db` database exists (persisted
  in the VM snapshot), but the cluster is NOT auto-started on boot. Start it with:
  `sudo pg_ctlcluster 16 main start`
- Connection used locally (superuser `postgres`, password `postgres`):
  `postgresql://postgres:postgres@localhost:5432/mining_db?schema=public`

### Environment variables
- `.env` is git-ignored (kept only in the snapshot). If it is missing, create it
  with `DATABASE_URL` (see above) and `NEXTAUTH_URL="http://localhost:3000"`.
- `ABACUSAI_API_KEY` (AI analysis) and `HTML2PDF_API_URL` (PDF export) are
  optional; the app runs without them (only those two features are disabled).

### Prisma
- After changing `prisma/schema.prisma`, or on a fresh/empty database, run
  `npx prisma db push` to sync the schema. `npx prisma generate` regenerates the
  client (already part of the update script).

### Running / testing
- Dev server: `npm run dev` (http://localhost:3000). API routes live under
  `app/api/*`; e.g. `GET/POST /api/projects`.
- Lint is effectively unconfigured: there is no ESLint config file, and
  `next.config.js` sets `eslint.ignoreDuringBuilds: true`. `npm run lint`
  triggers Next.js's interactive ESLint setup prompt, so it is not usable
  non-interactively as-is.
- Node 22 is used here; the app targets Node 18+/20 LTS per the README but runs
  fine on 22.
