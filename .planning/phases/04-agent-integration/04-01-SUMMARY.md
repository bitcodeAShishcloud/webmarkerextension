---
phase: 04-agent-integration
plan: 01
subsystem: agent-integration
tags: [CMOD-12, vision-gating, null-usage, cors, screenshot]
requires:
  - phase: 03-test-probe-robustness
    provides: "resolveProfile threads overrides.vision; streamTurn returns null usage"
provides:
  - "strict === true screenshot gating in toolsForRun and AgentLoop.#screenshotImage"
  - "null-safe usage handling in streamTurn (finish-step/finish)"
  - "ScriptedModel can emit a null-usage reply"
  - "distinct CORS/status-0 origin-allowance notice in RunManager.#launch"
affects: [agent-loop, model-selection, run-manager]
tech-stack:
  added: []
  patterns: [strict boolean gating, null-usage degradation to char estimation]
key-files:
  modified:
    - src/agent/tools.ts
    - src/agent/loop.ts
    - src/llm/stream.ts
    - src/llm/scripted.ts
    - src/extension/run-manager.ts
decisions:
  - "Screenshot tool registered only when options.vision === true (D-01)"
  - "AgentLoop attaches screenshot image only when profile.vision === true (D-01)"
  - "streamTurn leaves usage null when server omits it; loop falls back to char estimation (D-02)"
  - "ScriptedModel emits no usage field when reply.usage === null (D-02)"
  - "CORS/status-0 failures surface a distinct origin-allowance notice (D-03)"
patterns-established:
  - "Strict boolean gating instead of truthy shortcuts for capability flags"
  - "Null-safe stream usage with estimation fallback"
requirements-completed: [CMOD-12]
metrics:
  duration: ~5min
  completed: 2026-10-31
  tasks: 3
  files: 5
status: complete
actuals:
  tokens: 1500
  tasks: 3
  commits: 3
  plan_head_before: 4b9acffc1c160b1d44c2df44c85aec25554b716a
  plan_head_after: a519ed061ac7544123bbaef6f57a0aee8827cf60
---

# Phase 4 Plan 1: Agent Integration Summary

**Harden the three agent-integration seams CMOD-12 depends on: strict `=== true` screenshot gating, a null-safe usage path through the stream layer (plus a null-capable ScriptedModel), and a distinct CORS/status-0 notice for agent runs.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-10-31
- **Completed:** 2026-10-31
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Screenshot tool is registered only when `options.vision === true`; `AgentLoop.#screenshotImage` attaches an image only when `profile.vision === true`, so non-boolean truthy values can no longer enable screenshots.
- `streamTurn` no longer calls `toUsage` on undefined; usage stays null when the server omits it, letting the loop fall back to character estimation.
- `ScriptedModel` supports `usage: null` (omitting the usage field from the finish part) while preserving the 100/10 default when usage is omitted.
- `RunManager.#launch` surfaces a distinct origin-allowance notice when a run fails with a network error and no status code.

## Task Commits

1. **Task 1: Tighten screenshot gating to strict === true** - `cb9d3b0` (feat)
2. **Task 2: Guard null usage in stream and make ScriptedModel null-capable** - `f109151` (feat)
3. **Task 3: Distinct CORS / status-0 notice for agent runs** - `a519ed0` (feat)

## Files Created/Modified

- `src/agent/tools.ts` - strict vision gating in `toolsForRun`
- `src/agent/loop.ts` - strict vision check in `#screenshotImage`
- `src/llm/stream.ts` - null-usage guard in finish-step/finish
- `src/llm/scripted.ts` - `usage: null` support
- `src/extension/run-manager.ts` - distinct CORS/origin notice in `#launch`

## Decisions Made

None - followed plan as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Strict gating, null-usage guard, and CORS notice in place.
- type-check passes; src/agent and src/llm tests pass (409 passed).

## Self-Check: PASSED

---
*Phase: 04-agent-integration*
*Completed: 2026-10-31*