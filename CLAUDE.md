# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                  # run all tests (vitest run)
npx vitest run <pattern>  # run a single test file, e.g. npx vitest run mergeSettings
```

## Architecture

ESM-only Node.js project (`"type": "module"` in package.json). All source lives under `src/`, organized by feature domain (e.g. `src/settings/`). Tests sit in `__tests__/` subdirectories next to the modules they cover and use Vitest.

### `src/settings/mergeSettings.js`

Merges user settings over a defaults object. Only keys present in `defaults` are accepted — unknown keys from user input are silently dropped. This is intentional: it guards against stale or malicious data from the database polluting the settings object.

## Releases

Versioning and changelog are automated via **semantic-release** (config: `.releaserc.json`). On every push to `main` the `release` CI job runs after tests and:

- bumps `package.json` version (`fix:` → patch, `feat:` → minor, `BREAKING CHANGE` → major)
- appends to `CHANGELOG.md`
- creates a GitHub Release

Commit messages **must** follow [Conventional Commits](https://www.conventionalcommits.org/). A commit that doesn't match any release-triggering prefix (`fix:`, `feat:`, etc.) will not produce a release.

## Architecture Decision Records

Significant architectural decisions are documented in `docs/decisions/`. Use `docs/decisions/template.md` as a starting point; number files sequentially (`0002-...`, `0003-...`).
