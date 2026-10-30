---
phase: 03-test-probe-robustness
plan: 01
subsystem: llm-probes
tags: [CMOD-10, CMOD-11, testConnection, tool-probe, vision-probe, CUT_SHORT]
requires:
  - phase: 02-profile-wiring-validation
    provides: "resolveProfile threads overrides.maxOutput; requestOutputLimit honors user cap"
provides:
  - "testConnection sizes tool probe cap from spec.maxOutputTokens (Math.min(4096, Math.max(1024, userMaxOutput))) with one 4096 retry on CUT_SHORT"
  - "vision probe requires 'red' in the answer; non-match yields vision = false"
  - "probe failures surface the server's exact 400 body via result.error.message"
  - "testModel threads stored overrides.maxOutput into spec.maxOutputTokens"
affects: [model-selection, agent-loop, screenshot-tool-gating]
tech-stack:
  added: []
  patterns: [sized probe cap, single retry at full cap, red-gated vision detection]
key-files:
  modified:
    - src/llm/connection.ts
    - src/options/model-test.ts
    - src/llm/__tests__/connection.test.ts
decisions:
  - "Tool probe cap computed as Math.min(4096, Math.max(1024, userMaxOutput)) from spec.maxOutputTokens (D-01)"
  - "Single retry at 4096 on CUT_SHORT before marking noToolCalling; probes continue with 4096 cap on success (D-01)"
  - "Vision probe sets vision = true only when answer matches /red/i; a 200 without 'red' yields vision = false (D-02)"
  - "Manual overrides stay authoritative: probeAsk only runs image probe when vision is not already stated (D-02)"
  - "Probe errors keep surfacing result.error.message (errorText, includes 400 body), including retry path (D-03)"
  - "Usage read with optional chaining r.usage?.reasoning so null usage never crashes a probe (D-04)"
metrics:
  duration: ~10min
  completed: 2026-10-31
  tasks: 3
  files: 3
status: complete
actuals:
  tokens: 1500
  tasks: 3
  commits: 3
  plan_head_before: a1da10cd7c652a56033e81df6caadd12806dbae3
  plan_head_after: ad86cc0cd6c32baa6462241ac44aaca17dfa4640
requirements-completed: [CMOD-10, CMOD-11]
---

# Phase 3 Plan 1: Test Probe Robustness Summary

**One-liner:** Harden `testConnection`'s tool and vision probes — size the tool probe cap from the user's MAX_TOKENS with one 4096 retry on CUT_SHORT, gate vision on "red" in the answer, surface the server's exact 400 body, and thread the stored maxOutput override into `spec` via `testModel`.

## What was built

- `src/llm/connection.ts`: `testConnection` computes `cap = Math.min(4096, Math.max(1024, userMaxOutput))` from `spec.maxOutputTokens`, wraps the probe in a `makeProbe(maxTokens)` factory, and retries once at 4096 when the first reply is cut short (`finish === 'length'`) before recording `CUT_SHORT`; on a successful retry the probes continue with the 4096 cap. The image probe sets `tested.vision = /red/i.test(r.text ?? '')` on a 200, so a non-red answer yields `vision = false`. Errors keep surfacing `result.error.message` (including on the retry path), and usage is read via `r.usage?.reasoning ?? 0`.
- `src/options/model-test.ts`: `testModel` now sets `spec.maxOutputTokens = stored?.overrides?.maxOutput`, so the probe cap reflects the user's setting; the stored override lookup moved before spec construction.
- `src/llm/__tests__/connection.test.ts`: vision probe case updated so a "red" answer yields `vision: true` and a non-red 200 yields `vision: false`.

## Task Commits

1. **Task 1: Size tool probe cap and retry once at 4096 on CUT_SHORT (D-01)** - `1dbc818` (feat)
2. **Task 2: Require "red" in the vision probe answer (D-02)** - `1dbc818` (feat)
3. **Task 3: Thread user maxOutput into spec and adapt tests (D-01, D-03, D-04)** - `1dbc818` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CMOD-10 and CMOD-11 satisfied; tool-calling and vision probes hardened.
- Ready for Phase 4 (UI exposure of MAX_TOKENS/CONTEXT_WINDOW and vision).

## Self-Check: PASSED

- All changed files exist.
- type-check passes (`tsc --noEmit`).
- Tests pass (820 passed, 4 skipped).
- Manual override authoritative via `probeAsk` (image probe only when vision not already stated).

---
*Phase: 03-test-probe-robustness*
*Completed: 2026-10-31*
