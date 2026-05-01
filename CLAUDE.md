# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server (webpack, hot reload)
npm run serve

# Production build
npm run build:production

# Development build (no watch)
npm run build:development

# TypeScript type check only
npm run build:check

# Tests (single run)
npm test

# Tests (watch mode)
npm run test:watch

# Run a single test file
npx vitest --watch=false --config vite.config.ts src/path/to/file.test.ts

# Lint
npm run lint

# Stylelint (CSS/SCSS)
npm run stylelint
```

Requires Node >= 24, npm >= 11. Do not use yarn.

## Architecture

### Tech Stack

- **TypeScript** — all new files must be `.ts`/`.tsx`
- **React 18** + **React Router 6** (hash-based routing via `createHashRouter`)
- **TanStack Query** — server-state management; prefer over local state for API data
- **MUI v6** — UI components in Dashboard and Experimental apps only
- **Webpack 5** — bundler; `src/` is the module root (imports resolve from `src/` without `./`)
- **Vitest** + **jsdom** — unit tests

### Four Apps

The router at `src/RootAppRouter.tsx` selects between apps based on URL path and layout mode:

| App | Path | Notes |
|-----|------|-------|
| `src/apps/stable` | default user routes | Supports TV layout; legacy-heavy |
| `src/apps/experimental` | default user routes (when layout=experimental) | MUI rewrite; no TV support |
| `src/apps/dashboard` | `/dashboard/*` | Admin UI; fully MUI |
| `src/apps/wizard` | `/wizard/*` | First-time setup |

The layout (stable vs experimental) is chosen at startup from localStorage and cannot change at runtime without a reload.

### Plugins (`src/plugins/`)

Despite the name, these are internal client modules, not server plugins. All media player implementations live here (e.g., `htmlVideoPlayer`, `hlsPlayer`, `chromecastPlayer`). They are loaded dynamically at runtime and can be overridden by native wrappers.

### API Usage

- **New code**: use `@jellyfin/sdk` (the official TypeScript SDK)
- **Legacy code**: uses `jellyfin-apiclient` — avoid in new code
- `src/apiclient.d.ts` types the legacy client for interop

### Module Resolution

`tsconfig.json` sets `baseUrl: "src"` and webpack resolves modules from `src/` as well. This means `import foo from 'components/Foo'` resolves to `src/components/Foo` without any relative path.

### Directory Notes

- `src/controllers/` — legacy page controllers; **do not add new files here** (marked ❌)
- `src/scripts/` — legacy utilities; **do not add new files here** (marked ❌)
- `src/elements/` — legacy web components; prefer MUI equivalents in dashboard/experimental
- New features belong under the relevant `src/apps/<app>/features/` directory following Bulletproof React conventions

### Translations

- Only commit changes to `src/strings/en-us.json` (source language)
- All other languages are managed via Weblate — do not edit them directly
- Do not rename existing translation keys (breaks Weblate tracking)

### Browser Compatibility

The browserslist in `package.json` targets old browser versions including specific Chromium releases for TV platforms. Avoid APIs that cannot be polyfilled or transpiled for these targets. Use `npm run build:es-check` to verify output compatibility.
