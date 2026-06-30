# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Huligan

Load-testing platform that simulates up to 10 000 real users against a target chat application. Virtual users are coordinated by an Orchestrator, executed by Workers, and monitored via a React Admin Panel.

## Architecture

```
Admin Panel (React)
      │
      ▼
Orchestrator (API coordinator)
      │  distributes virtual users
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

Only `src/settings/mergeSettings.js` is implemented. Next modules by priority:
1. `scanThemes` / `scanLocales` — read available themes and locales from the filesystem

## Code

ESM-only Node.js (`"type": "module"`). All source lives under `src/`, organized by feature domain. Tests sit in `__tests__/` subdirectories next to the modules they cover.

**Development discipline:** TDD — write the test first, then the minimal implementation. Conventional Commits are mandatory (semantic-release uses them for versioning).

### `src/settings/mergeSettings.js`

Merges user settings over a defaults object. Only keys present in `defaults` are accepted — unknown keys are silently dropped to guard against stale or malicious data from the DB.

## Commands

```bash
npm test                  # run all tests (vitest run)
npx vitest run <pattern>  # run a single test file, e.g. npx vitest run mergeSettings
```

## Releases

Automated via **semantic-release** (config: `.releaserc.json`). On every push to `main` the `release` CI job runs after tests and bumps `package.json`, appends to `CHANGELOG.md`, and creates a GitHub Release.

Prefix mapping: `fix:` → patch, `feat:` → minor, `BREAKING CHANGE` → major. `docs:`, `chore:`, `test:` do not trigger a release.

## Architecture Decision Records

Significant decisions are documented in `docs/decisions/`. Use `docs/decisions/template.md` as a starting point; number files sequentially (`0002-...`, `0003-...`).
