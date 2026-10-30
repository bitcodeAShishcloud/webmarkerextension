---
phase: 03-test-probe-robustness
verified: 2026-10-31T00:35:00Z
status: passed
score: 6/6 must-haves verified
covered_files:
  - .planning/phases/03-test-probe-robustness/03-01-PLAN.md
  - .planning/phases/03-test-probe-robustness/03-01-SUMMARY.md
  - src/llm/__tests__/connection.test.ts
  - src/llm/connection.ts
  - src/options/model-test.ts
covered_digest: "v3:sha256:23f3495e8bf6367e4de8ad23f4860cdb6121f6054d99229df2139c1d799fe600"
behavior_unverified: 0
overrides_applied: 0
re_verification: false
requirements: [CMOD-10, CMOD-11]
---

# Phase 3: Test Probe Robustness Verification Report

**Phase Goal:** Tool-calling and vision detection are accurate and don't misclassify models
**Verified:** 2026-10-31T00:35:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tool probe sizes output cap from user cap as `Math.min(4096, Math.max(1024, userMaxOutput))` from `spec.maxOutputTokens`, retries once at 4096 on CUT_SHORT | ✓ VERIFIED | `connection.ts`: `userMaxOutput = typeof spec.maxOutputTokens === 'number' ? ... : 0`; `cap = Math.min(4096, Math.max(1024, userMaxOutput))`; retry branch `streamTurn(makeProbe(4096))` when `!toolCalling && result.finish === 'length'` |
| 2 | A reply cut short on first attempt but successful on 4096 retry is not marked CUT_SHORT and probes continue with 4096 cap | ✓ VERIFIED | Spot-check: first request cut short (length), second returns tool call → `ok: true, toolCalling: true`, no CUT_SHORT, effort probe body `max_tokens === 4096` |
| 3 | Vision probe sets `vision = true` only when answer contains 'red' (case-insensitive); a 200 without 'red' yields `vision = false` | ✓ VERIFIED | `connection.ts`: `tested.vision = /red/i.test(r.text ?? '')`; existing test + spot-check (Red/RED/rEd → true; 'blue' → false) |
| 4 | Manual overrides stay authoritative because `probeAsk` only runs image probe when vision is not already stated | ✓ VERIFIED | `profiles.ts`: `visionStated` includes `overrides?.vision !== undefined`; `probeAsk` returns `image: !visionStated`; `connection.ts` runs image probe only `if (ask.image)` |
| 5 | Probe failures surface the server's exact 400 body via `result.error.message`, including on retry path | ✓ VERIFIED | `connection.ts`: returns `error: result.error.message` (initial) and `error: retryResult.error.message` (retry); spot-check confirms retry 400 body surfaced |
| 6 | Usage read with optional chaining `r.usage?.reasoning` so null usage never crashes a probe | ✓ VERIFIED | `connection.ts`: `(r.usage?.reasoning ?? 0) > 0` |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/llm/connection.ts` | testConnection with sized cap, single 4096 retry on CUT_SHORT, red-gated vision probe | ✓ VERIFIED | Exists, substantive, wired to stream.ts |
| `src/options/model-test.ts` | testModel threads stored `overrides.maxOutput` into `spec.maxOutputTokens` | ✓ VERIFIED | `spec.maxOutputTokens = stored?.overrides?.maxOutput`; prettier formatting corrected |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/options/model-test.ts` | `src/llm/connection.ts` | `spec.maxOutputTokens` feeds tool probe cap | WIRED | Manual: `testModel` builds spec with `maxOutputTokens`, passes to `testConnection`, which computes cap from it |
| `src/llm/connection.ts` | `src/llm/stream.ts` | `streamTurn` result.finish / result.text / result.usage | WIRED | Manual: `import { streamTurn } from './stream'`; used in probe and retry |
| `src/llm/profiles.ts` | `src/llm/connection.ts` | `probeAsk` gates image probe on `visionStated` | WIRED | Manual: `probeAsk` returns `image: !visionStated`; `testModel` passes `ask` to `testConnection`, which runs image probe only `if (ask.image)` |

### Data-Flow Trace (Level 4)

Not applicable — phase delivers probe logic, no rendered dynamic data.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Retry-success path not marked CUT_SHORT, 4096 cap propagates | vitest inline spot-check | 1 passed | ✓ PASS |
| Retry path surfaces 400 body | vitest inline spot-check | 1 passed | ✓ PASS |
| Vision red-gating case-insensitive (Red/RED/rEd → true) | vitest inline spot-check | 1 passed | ✓ PASS |
| Existing connection test suite | `vitest run connection.test.ts` | 22 passed | ✓ PASS |
| Type-check | `tsc --noEmit` | exit 0 | ✓ PASS |
| Lint (phase files) | `eslint` on 3 files | exit 0 | ✓ PASS |
| Prettier (phase files) | `prettier --check` | pass after formatting fix | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CMOD-10 | 03-01 | Test models probes tool calling and marks models that cannot tool-call | ✓ SATISFIED | `testConnection` probes tool calling with sized cap + 4096 retry; `model-test.ts` sets `noToolCalling = !result.toolCalling` |
| CMOD-11 | 03-01 | Vision capability auto-detected and gates screenshot tool | ✓ SATISFIED | Vision probe requires 'red'; `probeAsk` gates on `visionStated` (manual override authoritative) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/llm/__tests__/profiles.test.ts` | 33 | Unused variable `fromApi` | ⚠️ Warning (pre-existing, Phase 2) | Fails lint; not introduced by Phase 3 |
| `src/options/__tests__/model-test.test.ts` | 5 | Unused import `db` | ⚠️ Warning (pre-existing, Phase 2) | Fails lint; not introduced by Phase 3 |

### Human Verification Required

None — all truths verified programmatically and via spot-checks.

### Gaps Summary

No gaps. All 6 must-have truths verified; CMOD-10 and CMOD-11 satisfied. Phase 3 goal achieved.

One minor formatting fix applied to `src/options/model-test.ts` (line wrap to satisfy prettier printWidth 120) — no logic change. Two pre-existing lint warnings in Phase 2 test files are out of scope for this phase but should be cleaned up to keep CI green.

---

_Verified: 2026-10-31T00:35:00Z_
_Verifier: the agent (gsd-verifier)_