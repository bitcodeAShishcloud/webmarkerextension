---
last_mapped_commit: 19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458
last_mapped_at: 2026-10-30
---
# Technology Stack

**Analysis Date:** 2026-10-30

## Languages

**Primary:**
- TypeScript 6.0.3 - All extension and layer source under `src/`, `entrypoints/`, `wxt.config.ts`, `tsconfig.json`, `vitest.config.mts`, `tailwind.config.ts`

**Secondary:**
- JavaScript (ES modules, Node 24) - Build/dev scripts and fixture server: `fixtures/server.mjs`, `fixtures/autorun.mjs`, `fixtures/chrome.mjs`, `scan2.mjs`
- HTML/CSS - Entrypoint HTML shells under `entrypoints/*/index.html`, Tailwind utility classes
- JSON - i18n catalogues `src/ui/locales/{en,zh_CN,zh_TW}.json`, manifest locale strings under `public/_locales/`

## Runtime

**Environment:**
- Chrome Extension (Manifest V3) - Minimum Chrome version 125 (`wxt.config.ts` `manifest.minimum_chrome_version`)
- Node.js >= 24.22.1 (engines in `package.json`); CI uses Node 24 with `check-latest`
- Chrome for Testing (headless, plain process, `--use-mock-keychain`) for `pnpm autorun` browser checks

**Package Manager:**
- pnpm 10.34.7 (pinned via `packageManager` in `package.json`)
- Lockfile: `pnpm-lock.yaml` present (CI runs `pnpm install --frozen-lockfile`)

## Frameworks

**Core:**
- WXT 0.21.4 - Chrome extension build framework (`wxt.config.ts`, `web-ext.config.ts`)
- React 18.3.1 - UI for side panel, options, welcome, permission, test panel (`src/side-panel/`, `src/options/`, `src/test-panel/`)
- Vercel AI SDK `ai` 7.0.150 - Model calls, streaming, tool calling, transcription (`src/llm/`)

**AI Providers (SDK adapters):**
- `@ai-sdk/anthropic` 4.0.87
- `@ai-sdk/google` 4.0.104
- `@ai-sdk/openai` 4.0.101

**Testing:**
- Vitest 5.0.5 - Unit tests (`src/**/__tests__/**/*.test.{ts,tsx}`)
- `fake-indexeddb` 6.2.6 - IndexedDB in tests

**Build/Dev:**
- Vite 8.3.5 (via WXT) - Bundling
- TypeScript 6.0.3 - Type checking (`pnpm type-check`)
- Tailwind CSS 3.4.17 - Styling (`tailwind.config.ts`)
- PostCSS 8.5.31 + Autoprefixer 10.6.1 - CSS processing
- ESLint 9.39.5 - Linting (`eslint.config.js`)
- Prettier 3.9.10 - Formatting (`.prettierrc`, printWidth 120, 2 spaces, single quotes, semicolons)

## Key Dependencies

**Critical:**
- `ai` 7.0.150 - Language model abstraction, streaming, tool calls, transcription
- `puppeteer-core` ^25.16.0 - Frame manager over `chrome.debugger` (ExtensionTransport) (`src/browser-control/host/puppeteer.ts`)
- `zod` 4.6.7 - Schema validation for tool args and analytics payloads
- `idb` ^8.0.4 - IndexedDB wrapper (`src/store/db.ts`)

**UI:**
- `@radix-ui/react-dialog` ^1.3.1 - Dialog primitives
- `react-markdown` ^10.1.0 - Markdown rendering
- `rehype-sanitize` ^6.0.0 - Sanitize rendered HTML
- `remark-gfm` ^4.0.1 - GitHub-flavored Markdown

**Browser Control Layer:**
- `@types/chrome` ^0.3.6 - Chrome API types

**Dev tooling:**
- `@vitejs/plugin-react-swc` ^4.3.3 - React fast refresh
- `@typescript-eslint/*` 8.72.0 - TS linting
- `eslint-plugin-import` 2.32.0 - Import rules (layer/extension boundaries)
- `eslint-plugin-jsx-a11y` 6.10.2, `eslint-plugin-react` 7.37.5, `eslint-plugin-react-hooks` 7.1.1
- `eslint-plugin-tailwindcss` ^3.18.2
- `rimraf` ^6.1.3 - Clean script

## Configuration

**Environment:**
- `.env.example` - Template for `VITE_POSTHOG_API_KEY` and `VITE_POSTHOG_HOST`
- `vite-env.d.ts` - Typed `import.meta.env` (`WXT_AUTORUN_URL`, `VITE_POSTHOG_API_KEY`, `VITE_POSTHOG_HOST`)
- Runtime env (dev/test): `WXT_AUTORUN_URL`, `WXT_PRODUCT_PERMISSIONS`, `FIXTURE_PORT`, `NB_LIVE`, `CHROME_PATH`, provider keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_GENERATIVE_AI_API_KEY`, `OPENROUTER_API_KEY`)
- `.npmrc` - `engine-strict=true`, `minimum-release-age=1920` (supply-chain safety)

**Build:**
- `wxt.config.ts` - WXT/manifest config, alias `@src`, outDir, permissions, Vite plugins (React SWC, Tailwind, autoprefixer), sourcemaps in dev
- `tsconfig.json` - Strict TS, extends `.wxt/tsconfig.json`, JSX react-jsx, lib DOM/ESNext
- `vitest.config.mts` - Test include `src/**/__tests__/**/*.test.{ts,tsx}`, alias `@src`
- `eslint.config.js` - Flat config with import boundary rules
- `.prettierrc` - 2 spaces, semicolons, single quotes, trailing commas, printWidth 120
- `tailwind.config.ts` - Content globs, darkMode class, theme tokens

## Platform Requirements

**Development:**
- Node.js 24 LTS (>= 24.22.1), pnpm 10.34.7
- Chrome or Edge for loading unpacked `dist/`
- Chrome for Testing for `pnpm autorun` (install via `pnpm install-chrome`)

**Production:**
- Chrome/Edge with Manifest V3, minimum Chrome 125
- Extension loaded unpacked from `dist/` or installed from Chrome Web Store

---

*Stack analysis: 2026-10-30*
