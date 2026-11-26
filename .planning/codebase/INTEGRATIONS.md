---
last_mapped_commit: 19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458
last_mapped_at: 2026-10-30
---
# External Integrations

**Analysis Date:** 2026-10-30

## APIs & External Services

**AI model providers (chat/completions, Responses API):**
- Anthropic - Claude models (`api.anthropic.com/v1`); requires `anthropic-dangerous-direct-browser-access` header for browser access
  - SDK/Client: `@ai-sdk/anthropic` (`createAnthropic`)
  - Auth: user API key (stored in `chrome.storage.local` under `nb.keys`)
- OpenAI - GPT/o-series via Responses API (`api.openai.com/v1`) (`openai.responses`)
  - SDK/Client: `@ai-sdk/openai` (`createOpenAI`)
  - Auth: user API key
- Google Gemini - `generativelanguage.googleapis.com/v1beta` (`createGoogle`)
  - SDK/Client: `@ai-sdk/google`
  - Auth: `x-goog-api-key` header
- OpenRouter - `openrouter.ai/api/v1` (chat completions; usage/cost accounting via stream tee)
  - SDK/Client: `@ai-sdk/openai` (`createOpenAI` with OpenRouter base URL)
  - Auth: Bearer token; sends `HTTP-Referer`/`X-Title` headers
- xAI Grok, DeepSeek, Mistral, Qwen, Kimi, GLM - reached through OpenAI-compatible endpoint or OpenRouter
  - SDK/Client: `@ai-sdk/openai` chat completions
  - Auth: Bearer token
- Ollama - local server `http://localhost:11434` (OpenAI-compatible `/v1`, plus `/api/tags`, `/api/ps`, `/api/show`)
  - SDK/Client: `@ai-sdk/openai`
  - Auth: none (key defaults to `'ollama'`); requires `OLLAMA_ORIGINS` for CORS
- LM Studio - local server `http://localhost:1234` (OpenAI-compatible; context via `/api/v0/models`)
  - SDK/Client: `@ai-sdk/openai`
  - Auth: none
- Any OpenAI-compatible endpoint - configured base URL

**Voice transcription:**
- OpenAI - `gpt-transcribe` model via `createOpenAI(...).transcription`
- Google Gemini - `gemini-3.5-transcribe` via `createGoogle(...).transcription`
  - Auth: user API key; language hints per provider

**Analytics:**
- PostHog - anonymous daily active-user ping and usage counts (`{host}/i/v0/e/`)
  - SDK/Client: raw `fetch` (no SDK); destination from `VITE_POSTHOG_API_KEY`/`VITE_POSTHOG_HOST` in production builds, or fixture server in autorun
  - Auth: `api_key` in request body

**Development / testing only:**
- Fixture server - `http://localhost:8787` (and 127.0.0.1, [::1]) serving static pages and a fake OpenAI-compatible model (`/__llm/v1/chat/completions`, `/__llm/v1/models`, `/__llm/v1/audio/transcriptions`) plus a fake PostHog endpoint
- Live provider keys endpoint - `http://localhost:8787/__live/keys` (only when `NB_LIVE=1`)

**Other external touchpoints:**
- Chrome Web Store uninstall feedback - optional Google Form opened by Chrome on uninstall (extension sets uninstall URL)
- Model documentation/source URLs - referenced in `src/llm/catalogue.ts` (vendor docs), not runtime calls

## Data Storage

**Databases:**
- IndexedDB `nanobrowser` (via `idb`, version 1) - `src/store/db.ts`
  - Connection: browser IndexedDB
  - Client: `idb` (`openDB`)
  - Stores: `conversations`, `entries`, `runs`, `blobs`, `shortcuts`

**Browser extension storage:**
- `chrome.storage.local` - settings (`nb.settings`), providers (`nb.providers`), API keys (`nb.keys`), site rules (`nb.siteRules`), analytics state/counts/queue, upgrade record, whats-new, shortcuts metadata, epoch
- `chrome.storage.session` - live conversation pair (`nb.live.<id>`)

**File Storage:**
- Chrome Downloads folder - saved files via `chrome.downloads` with blob URLs created in an offscreen document (`src/extension/downloads.ts`, `entrypoints/offscreen/main.ts`)

**Caching:**
- In-memory caches in `createStorage` (`src/store/storage.ts`) plus `chrome.storage` change listeners for live updates

## Authentication & Identity

**Auth Provider:**
- Custom - API keys supplied by the user per provider
  - Implementation: keys stored in `chrome.storage.local` under `nb.keys` keyed by provider id; never exported or logged; sent only to their own provider endpoint

**Local server access:**
- Ollama requires `OLLAMA_ORIGINS` allowing the extension origin; LM Studio requires CORS enabled - detected and surfaced as `originRefused` in connection tests

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry/Crashlytics). Errors logged to `console` in the service worker.

**Logs:**
- `console.info`/`console.error` in service worker and checks; fixture server logs to stdout

**Analytics (opt-in):**
- PostHog capture endpoint receives personless events (`$process_person_profile: false`, `$geoip_disable: true`, no distinct user id reuse across days)

## CI/CD & Deployment

**Hosting:**
- Chrome Web Store (primary distribution); Edge Add-ons compatible

**CI Pipeline:**
- GitHub Actions (`.github/workflows/ci.yml`) - ubuntu-latest, Node 24, pinned pnpm 10.34.7
  - Steps: `prettier --check`, `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`
- Manual: `pnpm autorun` browser checks and live model checks before releases

**Build output:**
- `pnpm build` -> `dist/` (unpacked extension)
- `pnpm zip` -> `dist-zip/webmarker-extensions-<version>.zip` (no source maps)

## Environment Configuration

**Required env vars (production build):**
- `VITE_POSTHOG_API_KEY` - PostHog project key (optional; analytics off without it)
- `VITE_POSTHOG_HOST` - PostHog host (default template `https://us.i.posthog.com`)

**Optional/dev env vars:**
- `WXT_AUTORUN_URL` - switches build to autorun mode and routes analytics to fixture server
- `WXT_PRODUCT_PERMISSIONS` - build autorun copy with product permission lists
- `FIXTURE_PORT` - fixture server port (default 8787)
- `NB_LIVE` - enables live provider key endpoint and live checks
- `CHROME_PATH` - path to Chrome for Testing binary
- Provider keys for live checks: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_GENERATIVE_AI_API_KEY`, `OPENROUTER_API_KEY`, plus `NB_LIVE_ANTHROPIC`/`NB_LIVE_OPENAI`/`NB_LIVE_GEMINI`/`NB_LIVE_OPENROUTER` model overrides

**Secrets location:**
- API keys in `chrome.storage.local` (`nb.keys`); never in source or repo; `.env` not committed (`.env.example` only)

## Webhooks & Callbacks

**Incoming:**
- Chrome runtime messages (`chrome.runtime.onMessage`/`onConnect`) between service worker, panels, offscreen document
- `chrome.debugger` events and `chrome.tabs`/`chrome.webNavigation` listeners

**Outgoing:**
- HTTPS fetch to chosen AI providers (chat, models list, transcription)
- HTTPS fetch to PostHog capture endpoint (when enabled)
- `chrome.downloads` for saved files

---

*Integration audit: 2026-10-30*
