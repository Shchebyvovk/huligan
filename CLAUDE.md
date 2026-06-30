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
