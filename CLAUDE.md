# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Huligan

Load-testing platform that simulates up to 10 000 real users against a target chat application. Virtual users are coordinated by an Orchestrator, executed by Workers, and monitored via a React Admin Panel.

## Repo structure

```
backend/    Node.js backend (ESM) — deployed to Render
frontend/   React admin panel (Vite + Tailwind) — deployed separately
db/         PostgreSQL migrations
docs/       Architecture Decision Records (docs/decisions/)
```

## Architecture

```
Admin Panel (React, frontend/)
      │  REST API
      ▼
Orchestrator (backend/) — HTTP server, coordinates load test runs
      │  distributes virtual users via RabbitMQ
      ▼
Workers (Node.js / Go)
  - hold WebSocket connections
  - log in as real users
  - execute scenarios defined in DSL (JSON: login → send_message → wait → logout)
```

**Infrastructure:**
- **PostgreSQL** — tables: `test_users`, `test_sessions`, `test_scenarios`, `test_runs`, `admin_users`, `sessions`, `user_settings`
- **Redis** — worker coordination
- **RabbitMQ** — task queue

**Auth:** email + password login, sessions in DB; Google SSO planned.

**Settings:** Admin Panel has a settings modal. Available themes (`/themes/*.json`) and locales (`/locales/*.json`) are scanned dynamically from the filesystem. User settings are merged with `default-settings.json` — this is exactly what `mergeSettings.js` does.

## Current implementation state

**Backend** (`backend/src/`):
- `settings/mergeSettings.js` — merges user settings over defaults
- `settings/scanThemes.js`, `settings/scanLocales.js` — scan themes/locales from filesystem
- `auth/hashPassword.js` — `hashPassword` / `verifyPassword` via `node:crypto` scrypt
- `auth/session.js` — `createSession` / `validateSession` with db-adapter DI
- `scenario/parseScenario.js` — validates and parses DSL JSON scenarios
- `worker/runScenario.js` — executes scenario steps sequentially via client adapter
- `orchestrator/orchestrate.js` — distributes users across workers with concurrency limit

**Frontend** (`frontend/src/`):
- `pages/LoginPage.jsx` — email + password login form
- `pages/DashboardPage.jsx` — test run list, start new run
- `components/RunCard.jsx` — single run status card
- `components/SettingsModal.jsx` — theme + locale selectors
- `components/NewRunModal.jsx` — scenario + concurrency picker

**DB** (`backend/db/migrations/`):
- `001_initial_schema.sql` — all 7 tables

**Next:** HTTP API (Orchestrator server), real PostgreSQL db adapter, connect frontend to real API.

## Commands

```bash
# Backend
cd backend
npm test                  # run all tests (vitest run)
npx vitest run <pattern>  # run a single test file

# Frontend
cd frontend
npm run dev               # dev server
npm run build             # production build
```

## Backend code conventions

ESM-only (`"type": "module"`). Source under `backend/src/`, organized by domain. Tests in `__tests__/` next to modules.

**Development discipline:** TDD — write the test first, then the minimal implementation. Conventional Commits are mandatory (semantic-release uses them for versioning).

**DB adapter pattern:** functions that need DB access accept a `db` object (dependency injection) rather than importing a connection directly. This keeps unit tests free of real DB calls.

## Releases

Automated via **semantic-release** (config: `backend/.releaserc.json`). CI runs from `backend/` working directory. On push to `main`: bumps `package.json`, appends `CHANGELOG.md`, creates GitHub Release.

Prefix mapping: `fix:` → patch, `feat:` → minor, `BREAKING CHANGE` → major. `docs:`, `chore:`, `test:` do not trigger a release.

## TODO

- **`register` scenario step** — add `register` action to DSL (alongside `login`). After a successful `register` step, mark the user as registered in the target app (add targetUrl to `registered_in` in `test_users`). Currently only `login` exists; `register` deferred until the user pool feature is stable.
- **Live run progress** — show real-time progress bar while run is `running` (poll GET /api/runs/:id every second)
- **Latency chart** — visualize per-step latency after run completes (SVG, no external libs)
- **Persistent scenario storage** — uploaded scenarios lost on Render redeploy; consider S3 or Neon blob

## Architecture Decision Records

Significant decisions are documented in `docs/decisions/`. Use `docs/decisions/template.md` as a starting point; number files sequentially (`0002-...`, `0003-...`).
