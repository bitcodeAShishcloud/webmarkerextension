---
phase: 04-agent-integration
plan: 02
subsystem: agent-integration
tags: [CMOD-12, vision-gating, null-usage, cors, screenshot, testing]
requires:
  - phase: 04-agent-integration
    provides: "strict === true screenshot gating; null-safe stream usage; null-capable ScriptedModel; distinct CORS/status-0 notice"
provides:
  - "Screenshot-gating test flipping overrides.vision"
  - "Null-usage stream test asserting result.usage === null"
  - "Loop test proving graceful degradation to estimation on null usage"
  - "CORS/status-0 notice verification in run-manager"
affects: [agent-loop, model-selection, run-manager, testing]
tech-stack:
  added: []
  patterns: [strict boolean gating, null-usage degradation to char estimation]
key-files:
  created:
    - src/agent/__tests__/tools.test.ts
  modified:
    - src/llm/__tests__/stream.test.ts
    - src/agent/__tests__/loop.test.ts
    - src/llm/scripted.ts
key-decisions:
  - "ScriptedModel emits undefined totals (not an omitted field) for usage: null, because the AI SDK crashes reading inputTokens on a missing finish-part usage"
  - "CORS/status-0 notice and origin allowance (chrome-extension:// or *) verified in RunManager.#launch"
patterns-established:
  - "Null-usage replies are represented by undefined totals so the SDK yields undefined and toUsage collapses to null"
requirements-completed: [CMOD-12]
coverage:
  - id: D1
    description: "Screenshot tool registered only when profile.vision is strictly true"
    requirement: CMOD-12
    verification:
      - kind: unit
        ref: "src/agent/__tests__/tools.test.ts#includes screenshot only when vision is strictly true"
        status: pass
    human_judgment: false
  - id: D2
    description: "Null-usage stream reply returns usage null without throwing"
    requirement: CMOD-12
    verification:
      - kind: unit
        ref: "src/llm/__tests__/stream.test.ts#returns null usage when the server omits it"
        status: pass
    human_judgment: false
  - id: D3
    description: "Loop degrades gracefully to estimation on null usage"
    requirement: CMOD-12
    verification:
      - kind: unit
        ref: "src/agent/__tests__/loop.test.ts#degrades gracefully to estimation when usage is null"
        status: pass
    human_judgment: false
  - id: D4
    description: "Distinct CORS/status-0 origin-allowance notice in RunManager.#launch"
    requirement: CMOD-12
    verification:
      - kind: other
        ref: "grep -n \"must allow requests from browser extensions\" src/extension/run-manager.ts"
        status: pass
    human_judgment: false
actuals:
  tokens: 2000
  tasks: 3
  commits: 2
  plan_head_before: 9c7d3b0aaec6e33ba742837972f30cee1aa26531
  plan_head_after: e8493683edd00b5c69985be5144d3761ed8eaad9
duration: ~10min
completed: 2026-10-31
status: complete
---

# Phase 4 Plan 2: Agent Integration Verification Summary

**Closed CMOD-12 verification gaps with screenshot-gating, null-usage stream, and loop-degradation tests, plus a verified CORS/status-0 notice.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-10-31
- **Completed:** 2026-10-31
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added `src/agent/__tests__/tools.test.ts` resolving ollama qwen3:8b profiles with `overrides.vision` true/false and asserting screenshot presence/absence, including a truthy non-true value.
- Added a stream test proving a `usage: null` reply returns `usage === null` without throwing.
- Added a loop test proving graceful degradation to estimation on null usage (status done).
- Verified the distinct CORS/status-0 origin-allowance notice in `RunManager.#launch`.

## Task Commits

1. **Task 1: Screenshot-gating test flipping overrides.vision** - `40d7e0a` (test)
2. **Task 2: Null-usage stream and loop degradation tests** - `e849368` (test)

**Plan metadata:** docs commit pending

## Files Created/Modified

- `src/agent/__tests__/tools.test.ts` - new screenshot-gating test
- `src/llm/__tests__/stream.test.ts` - null-usage stream test
- `src/agent/__tests__/loop.test.ts` - null-usage loop degradation test
- `src/llm/scripted.ts` - emit undefined totals for `usage: null` (fix)

## Decisions Made

- ScriptedModel now emits a finish part whose usage has undefined totals for `usage: null`, because the AI SDK's stream transform calls `asLanguageModelUsage(chunk.usage)` unconditionally and crashes on a missing usage field.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ScriptedModel null-usage emission crashed the SDK**
- **Found during:** Task 2 (null-usage tests)
- **Issue:** Omitting the usage field from the finish part (as 04-01 did) made the AI SDK throw `Cannot read properties of undefined (reading 'inputTokens')` before streamTurn could observe null usage.
- **Fix:** Emit a finish-part usage object with undefined totals for `usage: null`, which the SDK transforms to undefined totals and `toUsage` collapses to `null`.
- **Files modified:** `src/llm/scripted.ts`
- **Verification:** stream and loop null-usage tests pass.
- **Committed in:** `e849368` (part of task 2 commit)

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for the null-usage path to function at all; no scope creep.

## Issues Encountered

- The AI SDK (7.0.150) requires a usage object on the finish chunk; null usage must be represented by undefined totals rather than an omitted field.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CMOD-12 verification gaps closed; type-check and targeted tests pass.

---
*Phase: 04-agent-integration*
*Completed: 2026-10-31*