---
phase: 02-profile-wiring-validation
plan: 01
subsystem: llm-profiles
tags: [CMOD-04, profiles, clamping, concurrency, overrides]
requires: []
provides:
  - "resolveProfile clamps override contextWindow to fromApi (D-01)"
  - "requestOutputLimit honors user cap with floor min(maxOutput, 1024) (D-02)"
  - "overrides survive withBaseUrl and saveTest (D-03)"
  - "local endpoints get maxConcurrent 1 via isCloudEndpoint (D-04)"
affects: [agent-loop, compaction, model-resolution]
tech-stack:
  added: []
  patterns: [Math.min clamping, isCloudEndpoint classification]
key-files:
  created:
    - src/options/__tests__/model-test.test.ts
  modified:
    - src/llm/profiles.ts
    - src/extension/models.ts
    - src/llm/__tests__/profiles.test.ts
    - src/extension/__tests__/live-pair.test.ts
decisions:
  - "Clamp user-entered context window to server-reported value when both exist (D-01)"
  - "requestOutputLimit floor is min(maxOutput, 1024) (D-02)"
  - "Local endpoints classified via isCloudEndpoint(kind, baseUrl) (D-04)"
metrics:
  duration: ~15min
  completed: 2026-10-30
  tasks: 3
  files: 5
status: complete
actuals:
  tokens: 60000
  tasks: 3
  commits: 3
---

# Phase 2 Plan 1: Profile Wiring & Validation Summary

**One-liner:** Wire per-model limits and vision into `resolveProfile` safely — clamp inflated user context windows to the server value, make `requestOutputLimit` honor the user cap, keep overrides across `withBaseUrl`/`saveTest`, and give local endpoints `maxConcurrent: 1` via `isCloudEndpoint`.

## What was built

- `src/llm/profiles.ts`: `resolveProfile` now clamps `overrides.contextWindow` to `fromApi.contextWindow` with `Math.min` when both exist; `requestOutputLimit` computes `floor = Math.min(profile.maxOutput, 1024)` so a small cap is never raised.
- `src/extension/models.ts`: concurrency branch switched from `LOCAL_KINDS.has(...)` to `!isCloudEndpoint(kind, baseUrl)`, so any local endpoint (ollama, lmstudio, openai-compatible at localhost/127.0.0.1/[::1]/private hosts) gets `maxConcurrent: 1`. `LOCAL_KINDS` import removed.
- Regression tests: `live-pair.test.ts` asserts overrides (contextWindow/maxOutput/vision) survive `withBaseUrl`; new `model-test.test.ts` asserts overrides survive `saveTest` merges (API-only and whole-test paths).

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- All changed files exist.
- Task commits: 21aa9fe, 372d6d5, 69321f5.
- type-check and tests pass.
