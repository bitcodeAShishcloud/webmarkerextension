---
phase: 01-settings-ui-validation
plan: 02
subsystem: ui
tags: [react, providers, base-url, validation, search, i18n]
requires:
  - phase: 01-01
    provides: expandable per-model panel, provider enable/disable toggle, detected-vs-set display
provides:
  - normalizeBaseUrl and validateBaseUrl helpers in src/llm/providers.ts
  - openAICompatibleBaseUrl appends /v1 for openai-compatible endpoints
  - Base URL normalization on blur with inline amber warning
  - Model list search/filter via the add-model input
affects: [02-profile-resolution, 03-probe, 04-agent-integration]
tech-stack:
  added: []
  patterns:
    - "Base URL normalized on blur: trim, strip trailing slashes, append /v1 when missing for chat-completions kinds"
    - "Validation returns a locale key (or null); invalid URLs still saved with inline warning"
key-files:
  created: []
  modified:
    - src/llm/providers.ts
    - src/options/ProvidersSection.tsx
    - src/ui/locales/en.json
    - src/ui/locales/zh_CN.json
    - src/ui/locales/zh_TW.json
    - src/llm/__tests__/providers.test.ts
key-decisions:
  - "normalizeBaseUrl only appends /v1 for ollama, lmstudio and openai-compatible kinds; other kinds are trimmed only"
  - "validateBaseUrl maps unparseable input to models.invalidUrl, bad scheme to models.urlScheme, missing host to models.urlHost; invalid URLs are still saved"
  - "Model-add input doubles as the always-visible search box: hidden models appear when a query is typed and the combined list is filtered by case-insensitive substring"
patterns-established:
  - "Pure string helpers exported from src/llm/providers.ts and re-exported via src/llm/index.ts"
requirements-completed: [CMOD-02, CMOD-03, CMOD-05, CMOD-06, CMOD-08, CMOD-09]
actuals:
  tokens: 2441
  tasks: 3
  commits: 3
duration: ~15min
completed: 2026-10-30
status: complete
---

# Phase 01 Plan 02: Settings UI Validation — Base URL Normalization and Model Search Summary

**Base URL normalization on blur (trailing slashes trimmed, /v1 auto-appended) with inline amber validation, plus search/filter on the model list, completing Phase 1 settings UI.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3
- **Files modified:** 6
- **Tests:** 819 (815 passed + 4 skipped)

## Accomplishments

- Added `normalizeBaseUrl(kind, raw)` and `validateBaseUrl(raw)` pure helpers to `src/llm/providers.ts`, exported via `src/llm`.
- Updated `openAICompatibleBaseUrl` so `openai-compatible` endpoints also get `/v1` appended when missing.
- Replaced the base URL `Input`'s `onBlur` in `ProviderItem` with normalization: writes via `withBaseUrl` when the normalized value differs, runs tests when the URL changed from focus or normalization changed it, and clears `urlAtFocus`.
- Rendered the validation message inline under the base URL field in amber without blocking save.
- Made the model-add input act as the always-visible search box: hidden models appear when a query is typed and the combined list is filtered by case-insensitive substring.
- Added `models.invalidUrl`, `models.urlScheme` and `models.urlHost` keys to all three locales.
- Added unit tests covering `normalizeBaseUrl` and `validateBaseUrl`.

## Task Commits

1. **Task 1: Base URL normalization on blur and inline validation** - `60b5f9e` (feat)
2. **Task 2: Model list search and filter** - `8e9f29b` (feat)
3. **Task 3: Unit tests and final verification** - `9d2ca14` (test)

## Files Created/Modified

- `src/llm/providers.ts` - `normalizeBaseUrl`, `validateBaseUrl`, updated `openAICompatibleBaseUrl`
- `src/options/ProvidersSection.tsx` - base URL normalization on blur, inline validation, datalist filter
- `src/ui/locales/en.json`, `zh_CN.json`, `zh_TW.json` - new validation keys
- `src/llm/__tests__/providers.test.ts` - helper tests

## Decisions Made

- Validation returns a locale key (or null) rather than a translated string, so the component calls `t(...)` and stays i18n-driven.
- Invalid URLs are saved with a warning rather than blocked, per D-16.
- `http://`-style scheme-only inputs map to `models.urlHost` so the missing-host case is reachable despite `new URL` throwing.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `new URL('http://')` throws in the runtime, so a scheme-only input cannot reach the hostname check through `new URL` alone; added a small regex special-case so the missing-host validation path is reachable and testable.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 settings UI complete; ready for Phase 2 profile resolution work.
- All verification (type-check, lint, tests) green.

---
*Phase: 01-settings-ui-validation*
*Completed: 2026-10-30*