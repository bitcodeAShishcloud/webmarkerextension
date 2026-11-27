---
phase: 01-settings-ui-validation
verified: 2026-11-27T04:42:19Z
status: passed
score: 14/14 must-haves verified
covered_files:
  - .planning/phases/01-settings-ui-validation/01-01-PLAN.md
  - .planning/phases/01-settings-ui-validation/01-01-SUMMARY.md
  - .planning/phases/01-settings-ui-validation/01-02-PLAN.md
  - .planning/phases/01-settings-ui-validation/01-02-SUMMARY.md
  - src/llm/__tests__/providers.test.ts
  - src/llm/providers.ts
  - src/options/ProvidersSection.tsx
  - src/options/VoiceCard.tsx
  - src/side-panel/App.tsx
  - src/store/settings.ts
  - src/ui/__tests__/catalogues.test.ts
  - src/ui/icons.tsx
  - src/ui/index.css
  - src/ui/locales/en.json
  - src/ui/locales/zh_CN.json
  - src/ui/locales/zh_TW.json
covered_digest: "v4:sha256:2f448ecb3dbea08a1e51abde47024f131b5a727a2fb0d60acf4923dc4345de52"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: passed
  previous_score: 14/14
  previous_verified: 2026-10-30T16:15:00Z
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 1: Settings UI & Validation Verification Report

**Phase Goal:** Users can enter and manage per-model limits, vision, and provider settings with validation
**Verified:** 2026-11-27T04:42:19Z
**Status:** passed
**Re-verification:** Yes — stale fingerprint invalidated by later-phase commits (rebrand, warm-gray theme, contrast fix, and the Phase 1 regex fix). All 14 must-haves re-checked against the CURRENT codebase, not the SUMMARY claims.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can add an OpenAI-compatible provider with a custom base URL and API key in Settings → Providers | ✓ VERIFIED | `ProvidersSection.tsx:33` openai-compatible kind; `KeyField` at 452-477; base URL `Input` at 478-515 writes via `withBaseUrl`; add flow at 356-362 |
| 2 | User can enable or disable a provider without deleting it; a disabled provider's card is dimmed | ✓ VERIFIED | `Switch` at 516-522 writes `updateProvider(id, { enabled })`; `<li ... opacity-50` at 420; no delete on toggle |
| 3 | A disabled provider's models do not appear in the default model picker or the side panel | ✓ VERIFIED | `ProvidersSection.tsx:99` and `App.tsx:191` filter `p.enabled !== false`; `VoiceCard.tsx:23`; `settings.ts:202,206` `usableModel` skips disabled |
| 4 | A disabled provider does not run Test models | ✓ VERIFIED | `runTests` early return at 371; `testAll` early return at 402 |
| 5 | Each model chip can be expanded to edit CONTEXT_WINDOW / MAX_TOKENS and set vision Auto/On/Off | ✓ VERIFIED | `ModelChip` expanded state at 798, panel at 880-956; `commitLimit` at 810-828; `setVision` at 830-836 |
| 6 | Empty limit inputs revert to detected; non-positive/non-integer values rejected inline | ✓ VERIFIED | `commitLimit` deletes override on empty (813-818); regex `/^\d+$/` and `> 0` check at 820 set an inline error (905,930). The over-escaped regex flagged open in `01-SECURITY.md` was fixed by commit `db9927b` and is correct in current source. |
| 7 | Settings shows detected vs. user-set values for context window, max output, and vision | ✓ VERIFIED | Placeholders at 888-892 / 913-917; `models.detected` badges at 902-904 / 927-929; vision source badge + tooltip at 945-950; conflict info at 953-954; filled/outline eye icon at 857 |
| 8 | User can add one or more model ids manually or from the `/models` list | ✓ VERIFIED | `addModel` at 356-362; `fetchModels` at 337-354; datalist options at 553-559 |
| 9 | Base URL normalized on blur: trailing slashes trimmed and `/v1` auto-appended | ✓ VERIFIED | `onBlur` at 490-507 calls `normalizeBaseUrl` (`providers.ts:75-81`); `/v1` logic at 65-66; named test `normalizeBaseUrl` passed (5 tests) |
| 10 | Invalid base URLs show an inline amber warning but are still saved | ✓ VERIFIED | `validateBaseUrl` at `providers.ts:87-101`; amber `<p class="text-amber-600 ...">` at 509-513; raw value saved on `onChange` at 485-488 (not blocked) |
| 11 | Model list supports search/filter for large catalogues | ✓ VERIFIED | Datalist at 553-559 includes hidden models when a query is typed and filters by case-insensitive substring; `ListedCount` at 982-991 |
| 12 | Disabled provider filtered in VoiceCard choices | ✓ VERIFIED | `VoiceCard.tsx:22-27` `.filter(p => p.enabled !== false)` |
| 13 | `enabled` defaults to enabled for stored providers (no migration) | ✓ VERIFIED | `settings.ts:114-115` optional flag with default comment; `usableModel` uses `!== false` at 202 and 206 |
| 14 | Catalogue parity across three locales | ✓ VERIFIED | `catalogues.test.ts` passes; all Phase 1 `models.*` keys present and translated in `en.json`, `zh_CN.json`, `zh_TW.json` (lines 28-58); rebrand/theme commits kept these keys intact |

**Score:** 14/14 truths verified (0 behavior-unverified)

### Deferred Items

None.

### Advisory (New Scope, Unevidenced)

None. No new-scope findings were raised in this re-verification; all observations trace to Phase 1 must-haves or to explicitly documented later-phase changes.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/store/settings.ts` | `ProviderConfig.enabled` optional flag; `usableModel` skips disabled | ✓ VERIFIED | 217 lines; lines 108-116, 196-211; gsd-tools `verify.artifacts`: exists, no issues |
| `src/options/ProvidersSection.tsx` | Toggle, expandable chip, overrides writes, URL handling, search | ✓ VERIFIED | 968 lines; all patterns present; gsd-tools `verify.artifacts`: exists, no issues |
| `src/side-panel/App.tsx` | models memo filters disabled providers | ✓ VERIFIED | 610 lines; line 191; gsd-tools `verify.artifacts`: exists, no issues |
| `src/options/VoiceCard.tsx` | choices filter disabled providers | ✓ VERIFIED | 64 lines; line 23 |
| `src/llm/providers.ts` | `normalizeBaseUrl`, `validateBaseUrl`, `openAICompatibleBaseUrl` with `/v1` | ✓ VERIFIED | 205 lines; lines 59-101; gsd-tools `verify.artifacts`: exists, no issues |
| `src/ui/icons.tsx` | `EyeIcon` filled support | ✓ VERIFIED | `filled` prop used at `ProvidersSection.tsx:857` |
| `src/ui/index.css` | Warm-gray theme with AA-contrast muted token | ✓ VERIFIED | `--nb-muted: 56 51 45` (= #38332D, 5.574:1) in `:root` and `.dark` (lines 5-30) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `ProvidersSection.tsx` | `settings.ts` | `updateProvider(id, { enabled })` and overrides writes | ✓ WIRED | Import of `@src/store/settings` at lines 10-17; `updateProvider` writes `providersStorage.set` at 73; enabled write at 519; `updateModel` overrides rewrite at 310-322, passed at 536 |
| `App.tsx` | `settings.ts` | models memo filters `p.enabled !== false` | ✓ WIRED | Imports `providersStorage` from `@src/store/settings` at line 4; `useStorage` at 71; filter at 191 |
| `ProvidersSection.tsx` | `providers.ts` | `normalizeBaseUrl` and `validateBaseUrl` | ✓ WIRED | Imported from `@src/llm` at line 6; called at 492 and 509/511 |

**Note on the automated key-link verb:** `gsd-tools query verify.key-links` reported 0/3 verified with detail "Target not referenced in source". This is a false negative from literal path-string matching — the code imports via the `@src/...` alias (`@src/store/settings`, `@src/llm`). Manual import-and-usage tracing above confirms all three links are WIRED. Artifact verification itself passed 5/5 via the same tool.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `ProvidersSection.tsx` | `provider.baseUrl` | `providersStorage` (chrome.storage.local) | ✓ | ✓ FLOWING |
| `ProvidersSection.tsx` | `model.overrides` | `providersStorage` (chrome.storage.local) | ✓ | ✓ FLOWING |
| `ProvidersSection.tsx` | `listed.models` / `listed.hidden` | `listModels` (/models endpoint) | ✓ | ✓ FLOWING |
| `App.tsx` | `models` | `providersStorage` via `useStorage` | ✓ | ✓ FLOWING |
| `VoiceCard.tsx` | `choices` | `providersStorage` + `keysStorage` | ✓ | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command (Node 24 direct binaries) | Result | Status |
|----------|-----------------------------------|--------|--------|
| Type check | `node node_modules/wxt/bin/wxt.mjs prepare && node node_modules/typescript/bin/tsc --noEmit` | exit 0, no errors | ✓ PASS |
| Lint | `node node_modules/eslint/bin/eslint.js . --cache ...` | exit 0, no errors | ✓ PASS |
| Full unit tests | `node node_modules/vitest/vitest.mjs run` | exit 0 — 74 passed / 1 skipped files; **823 passed / 4 skipped (827)** | ✓ PASS |
| Build | `node node_modules/wxt/bin/wxt.mjs build` | exit 0, `dist/` built (4.11 MB) | ✓ PASS |
| URL normalization behavior | `node node_modules/vitest/vitest.mjs run -t normalizeBaseUrl` | 5 passed, exit 0 | ✓ PASS |
| Override persistence across URL change (D-03) | `node node_modules/vitest/vitest.mjs run -t D-03` | 3 passed, exit 0 | ✓ PASS |

All commands used `C:\Users\shesh\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` (v24.14.0). System Node v22 + `pnpm` was deliberately bypassed because of `engine-strict`.

### Probe Execution

None applicable — no Phase 1 plan declares probes and no `scripts/*/tests/probe-*.sh` are part of this phase's deliverables.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CMOD-01 | 01-01 | Add OpenAI-compatible provider with base URL + key | ✓ SATISFIED | `KINDS` entry + `KeyField` + base URL `Input` |
| CMOD-02 | 01-02 | Add one or more model ids (manual + `/models`) | ✓ SATISFIED | `addModel` + `fetchModels` + datalist |
| CMOD-03 | 01-01/02 | Per-model MAX_TOKENS (max output) and CONTEXT_WINDOW | ✓ SATISFIED | `commitLimit` writes/removes `overrides`; regex fix verified |
| CMOD-05 | 01-01 | Override vision per model | ✓ SATISFIED | `setVision` Auto/On/Off |
| CMOD-06 | 01-01 | Detected vs. user-set display | ✓ SATISFIED | Placeholders, badges, eye icon, source tooltip, conflict line |
| CMOD-07 | 01-01 | Enable/disable provider | ✓ SATISFIED | Switch + dimmed card + picker filtering |
| CMOD-08 | 01-02 | Base URL normalization + validation | ✓ SATISFIED | `normalizeBaseUrl` + `validateBaseUrl`, tested |
| CMOD-09 | 01-02 | Model list search/filter | ✓ SATISFIED | Datalist filter + `ListedCount` |

No orphaned Phase 1 requirements: `REQUIREMENTS.md` maps exactly these eight IDs to Phase 1, and both plans declare them in their `requirements:` frontmatter.

### Threat Mitigation Coverage

| Threat ID | Disposition | Status | Evidence |
|-----------|-------------|--------|----------|
| T-01-01 (positive-integer validation) | mitigate | ✓ CLOSED | `ProvidersSection.tsx:820` uses correct `/^\d+$/` + `> 0`; the over-escaped regex recorded as open in `01-SECURITY.md` was fixed by commit `db9927b` |
| T-01-02 (enabled flag) | accept | ✓ CLOSED | Optional boolean, default enabled, no security impact |
| T-01-03 (stored XSS via names) | mitigate | ✓ CLOSED | No `dangerouslySetInnerHTML` anywhere under `src/` |
| T-01-SC / T-02-SC (new dependencies) | mitigate | ✓ CLOSED | No new dependencies introduced by Phase 1 |
| T-02-01 (base URL scheme/host) | mitigate | ✓ CLOSED | `validateBaseUrl` rejects non-http(s) schemes; used at line 509 |
| T-02-02 (javascript:/data: schemes) | mitigate | ✓ CLOSED | Scheme allowlist; `providers.test.ts:174-177` passes |
| T-02-03 (API key in URL) | accept | ✓ CLOSED | Keys in separate `keysStorage` (`settings.ts:121`); URL not logged |

### Decision Coverage

Gate result: **7 honored / 17, 10 not honored (soft warning only — status unchanged)**. The gate uses fuzzy substring matching against shipped artifacts, so paraphrased implementations read as "not honored". Manual code inspection confirms all 10 flagged decisions are implemented:

| Decision | Manual evidence | Status |
|----------|-----------------|--------|
| D-02 detected placeholders + badge | `ProvidersSection.tsx:888-904, 913-929` | ✓ implemented |
| D-03 empty reverts to detected | `commitLimit` deletes override key at 813-818 | ✓ implemented |
| D-04 positive integers only, inline error | `/^\d+$/` + `> 0` at 820, error at 905/930 | ✓ implemented |
| D-05 three-state vision toggle | Buttons Auto/On/Off at 935-943 | ✓ implemented |
| D-06 badge + tooltip naming source | `title` with `visionSourceKey` at 945-950 | ✓ implemented |
| D-07 manual override authoritative | Conflict info at 953-954; `effectiveVision` at 844 | ✓ implemented |
| D-08 vision exposed in Phase 1 | Panel at 932-955 | ✓ implemented |
| D-10 toggle in provider settings card | `Line` at 516-522 inside `ProviderItem` | ✓ implemented |
| D-11 disabled hides models from pickers | `ProvidersSection.tsx:99`, `App.tsx:191`, `VoiceCard.tsx:23`, `settings.ts:202,206` | ✓ implemented |
| D-15 validation inline under field | Amber warning `<p>` at 509-513 | ✓ implemented |

No decision was actually abandoned; the warning is a heuristic artifact, not a gap.

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `src/llm/__tests__/providers.test.ts` | CMOD-08 | 15 | 0 | none | Value (`toBe` on normalized/validated strings) | ✓ PASS |
| `src/ui/__tests__/catalogues.test.ts` | CMOD-06 | 5 | 0 | none | Value (`toEqual({missing:[],extra:[],same:[]})`) | ✓ PASS |
| `src/extension/__tests__/live-pair.test.ts` | CMOD-03/07 | active | 0 | none | Value + behavioral (`withBaseUrl`, `usableModel`, D-03) | ✓ PASS |

Disabled tests on requirements: 0. Circular patterns: 0. Insufficient assertions: 0.

### Later-Phase Change Regression Check

| Later change | Files affected | Effect on Phase 1 must-haves |
|--------------|----------------|------------------------------|
| Rebrand (commits `4074b1f`, `36e06e7`, `391091e`) | Locale catalogues, UI strings, package/manifest | No Phase 1 `models.*` key was removed or renamed; type-check and catalogue parity pass. Product-name strings still consistently read "WebMarker Extensions". |
| Warm-gray theme + contrast fix (commit `d7f2117`, `src/ui/index.css`) | Theme tokens | `--nb-muted` = `56 51 45` = #38332D (5.574:1, WCAG AA) in both themes; amber validation warning remains distinct. No Phase 1 logic touched. |
| Regex fix (commit `db9927b`) | `ProvidersSection.tsx` | Resolves the open T-01-01 finding; positive-integer overrides now persist as specified in D-04. |

No regressions detected.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None | ℹ️ Info | Scan of all 12 Phase 1 key files found no `TBD`/`FIXME`/`XXX`/`TODO`/`HACK` debt markers, no stub implementations, no hardcoded empty props, and no console-log-only handlers. Matches for "placeholder" are legitimate HTML `placeholder` props, i18n keys, and a CSS `::placeholder` rule, not debt markers. |

### Human Verification Required

None required. This is a regression re-verification of previously passed must-haves and every check is automatable (source inspection, unit tests, type-check, lint, build). An optional, non-blocking manual smoke of the provider toggle dimming and picker hiding was noted in the prior report; it remains optional and does not gate this phase.

### Gaps Summary

No gaps. All 14 must-haves verified against the current codebase; type-check, lint, 823 passing tests, and build are green; all CMOD requirements, threat mitigations, and decisions are covered. The stale fingerprint has been regenerated (`v4`).

---

_Verified: 2026-11-27T04:42:19Z_
_Verifier: the agent (gsd-verifier)_
