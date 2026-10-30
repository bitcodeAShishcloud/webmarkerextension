---
phase: 01-settings-ui-validation
plan: 01
subsystem: ui
tags: [react, settings, providers, model-overrides, i18n]

# Dependency graph
requires: []
provides:
  - "ProviderConfig.enabled optional flag; usableModel skips disabled providers"
  - "Provider enable/disable Switch, dimmed card, hidden models from pickers, skipped Test models"
  - "Expandable ModelChip panel editing context window, max output, vision override"
  - "Detected vs. user-set display with badges, eye icon, conflict info"
affects: [side-panel, options]

# Actuals
actuals:
  tokens: 5566
  tasks: 3
  commits: 3
  plan_head_before: 1900522367f15dc66477241695b51dc3c9f0b8f5
  plan_head_after: af3fa0c511914e0808773fb615deca959338e7bc

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optional enabled flag defaulting to enabled via !== false (no migration)"
    - "Expandable chip with local draft commit on blur/Enter; invalid never persisted"
    - "Detected values as placeholders/badges only when real detection exists"

key-files:
  created: []
  modified:
    - src/store/settings.ts
    - src/options/ProvidersSection.tsx
    - src/side-panel/App.tsx
    - src/options/VoiceCard.tsx
    - src/ui/icons.tsx
    - src/ui/locales/en.json
    - src/ui/locales/zh_CN.json
    - src/ui/locales/zh_TW.json
    - src/ui/__tests__/catalogues.test.ts

key-decisions:
  - "enabled is optional boolean; absent means enabled, so existing providers stay on"
  - "Vision Auto deletes overrides.vision; On/Off set true/false; manual override authoritative on conflict"
  - "Empty number input reverts to detected by deleting the override key"

patterns-established:
  - "ModelChip manages expanded state and local drafts; commits via onUpdateOverrides"
  - "Detected vs. user-set split using tested/fromApi/detectedContext precedence"

requirements-completed: [CMOD-01, CMOD-07]

# Metrics
duration: ~15min
completed: 2026-10-30
status: complete
---

# Phase 01 Plan 01: Settings UI & Validation Summary

**Provider enable/disable toggle, per-model expandable limits/vision panel, and detected-vs-set display across Settings -> Providers**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added optional `enabled` flag to `ProviderConfig`; `usableModel` skips disabled providers; pickers in side panel and VoiceCard filter disabled providers; disabled cards dimmed and Test models guarded.
- Converted `ModelChip` to an expandable panel with context window and max output inputs (positive-integer validation, empty reverts) and a three-state vision control (Auto/On/Off).
- Added detected-vs-user-set display: placeholders, detected badges, eye icon reflecting effective vision, vision source badge/tooltip, and conflict info line.

## Task Commits

1. **Task 1: Provider enable/disable end to end** - `8230755` (feat)
2. **Task 2: Expandable panel on ModelChip** - `6564806` (feat)
3. **Task 3: Detected vs. user-set display** - `af3fa0c` (feat)

## Files Created/Modified

- `src/store/settings.ts` - `enabled` field and usableModel guard
- `src/options/ProvidersSection.tsx` - Switch, expandable chips, updateModel helper, detected display
- `src/side-panel/App.tsx` - models memo filters disabled providers
- `src/options/VoiceCard.tsx` - choices filter disabled providers
- `src/ui/icons.tsx` - EyeIcon filled support
- `src/ui/locales/*.json` - new i18n keys in all three locales
- `src/ui/__tests__/catalogues.test.ts` - allowlist for `models.visionSourceApi`

## Decisions Made

- Used `enabled !== false` so stored providers remain enabled without migration.
- Vision Auto removes the override key; manual On/Off writes true/false and is authoritative on conflict.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Catalogue parity allowlist update**
- **Found during:** Task 3
- **Issue:** `models.visionSourceApi` value "API" is identical across locales, so the catalogue parity test flagged it as untranslated.
- **Fix:** Added the key to `SAME_IN_EVERY_LANGUAGE` in `catalogues.test.ts`.
- **Files modified:** `src/ui/__tests__/catalogues.test.ts`
- **Commit:** af3fa0c

**Total deviations:** 1 auto-fixed (blocking/test parity)
**Impact on plan:** Necessary for the catalogue parity check to pass; no scope creep.

## Issues Encountered

- None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Provider enable/disable and per-model overrides surface in Settings and pickers; ready for Phase 2 profile resolution work.

---
*Phase: 01-settings-ui-validation*
*Completed: 2026-10-30*