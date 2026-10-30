# Phase 3: Test Probe Robustness - Research

**Researched:** 2026-10-31
**Domain:** Test probes for tool-calling and vision detection in OpenAI-compatible custom models
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Tool probe uses `Math.max(1024, userMaxOutput)` capped at 4096; retries once at 4096 on CUT_SHORT before marking `noToolCalling`. — **Reversibility:** reversible
- **D-02:** Vision probe requires the answer to contain "red"; a non-matching 200 yields `vision = false`/unknown, with manual override authoritative. — **Reversibility:** reversible
- **D-03:** Probe failures surface the server's exact 400 body. — **Reversibility:** reversible
- **D-04:** Streaming/usage is treated as optional (estimate when null). — **Reversibility:** reversible

### the agent's Discretion
- Exact retry and estimation implementation.

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMOD-10 | Test models probes tool calling and marks models that cannot tool-call; such models cannot be selected as default | Tool probe in `src/llm/connection.ts` (`testConnection`) hardened: reasoning models no longer falsely marked `noToolCalling` because the cap grows with the user's `MAX_TOKENS` and a CUT_SHORT retries once at 4096 before failure is recorded. Exact 400 bodies surface so users can see why a probe failed. |
| CMOD-11 | Vision capability is auto-detected and gates the screenshot tool | Image probe in `src/llm/connection.ts` now requires the answer to contain "red" for `vision = true`; a 200 whose text does not mention the colour yields `vision = false`, preventing false positives. Manual `overrides.vision` stays authoritative because `probeAsk` only runs the image probe when vision is not already stated. |
</phase_requirements>

## Summary

Phase 3 hardens the two probes in `testConnection` (`src/llm/connection.ts`) and the wiring in `testModel` (`src/options/model-test.ts`). The tool probe currently sends a fixed `maxOutputTokens: 1024`, which reasoning models can exhaust while thinking and return `finish: 'length'` with no tool call; that is reported as `CUT_SHORT` and the model is left untested, but a user who raises `MAX_TOKENS` still hits the same 1024 cap. The fix is to size the probe from the user's cap (`Math.max(1024, userMaxOutput)` capped at 4096) and to retry once at 4096 on `CUT_SHORT` before giving up. The vision probe currently treats any 200 as success, even when the model never saw the image; tightening it to require "red" in the answer removes false positives. Probe failures already carry the server's message through `errorText`, which appends the response body, but the path must keep doing so and must not strip it. Usage is already optional in `streamTurn` (`toUsage` returns `null`) and in the loop (`if (reply.usage)`), so the probe's reasoning detection must keep using optional chaining.

**Primary recommendation:** Modify `testConnection` to compute the cap from `spec.maxOutputTokens`, retry the tool probe at 4096 on `CUT_SHORT`, require `/red/i` in the image probe's answer, and keep surfacing `result.error.message` (which already includes the 400 body). Thread `maxOutputTokens` from the stored override into `spec` in `testModel`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tool-calling probe | Options page (UI) | LLM layer (`src/llm`) | `testModel` runs in the options page with no worker; `testConnection` owns the request. |
| Vision probe | LLM layer (`src/llm`) | — | Pure function over a model call; result stored on the entry. |
| Error surfacing | LLM layer (`src/llm/errors.ts`) | Options page UI | `errorText`/`getApiCallResponseBody` produce the message; UI displays it. |
| Usage accounting | Agent loop (`src/agent`) | LLM layer | Null usage degrades to estimation; probe only reads usage opportunistically. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | (pinned) | `streamText`, `APICallError` | Already used; provides response body on errors. |
| `zod` | 4.6.7 | Schemas | Unchanged by this phase. |
| Vitest | 5.0.5 | Unit tests | Probe logic is pure and testable with recorded fetches. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `fake-indexeddb` | dev dep | Store tests | `model-test.test.ts` storage round-trips. |

**Installation:** none new.

## Code Examples

### Tool probe with cap and retry

```ts
// src/llm/connection.ts
const userMaxOutput = typeof spec.maxOutputTokens === 'number' ? spec.maxOutputTokens : 0;
let cap = Math.min(4096, Math.max(1024, userMaxOutput));

const makeProbe = (maxTokens: number): TurnRequest => ({
  chat: createModel({ ...spec, maxOutputTokens: maxTokens }, options),
  system: 'You are testing a tool connection. Call the tool report_status with status "ok". Do not write text.',
  messages: [{ role: 'user', content: 'Call report_status now.' }],
  tools: PROBE_TOOL,
  retry: { attempts: 1, baseMs: 0, maxMs: 0 },
});

let probe = makeProbe(cap);
let result = await streamTurn(probe);
// ... error handling ...
let toolCalling = result.toolCalls.some(c => c.toolName === 'report_status' && !c.invalid);

if (!toolCalling && result.finish === 'length') {
  if (cap < 4096) {
    const retryResult = await streamTurn(makeProbe(4096));
    if (retryResult.error) { /* surface retryResult.error.message */ }
    toolCalling = retryResult.toolCalls.some(c => c.toolName === 'report_status' && !c.invalid);
    if (!toolCalling && retryResult.finish === 'length') {
      return { ok: false, toolCalling: false, error: CUT_SHORT, ms: retryResult.durationMs };
    }
    cap = 4096;
    result = retryResult;
    probe = makeProbe(4096);
  } else {
    return { ok: false, toolCalling: false, error: CUT_SHORT, ms: result.durationMs };
  }
}
```

### Vision probe requiring "red"

```ts
// src/llm/connection.ts (image probe)
if (r.error && refusesImages(r.error.status, r.error.message)) tested.vision = false;
else if (!r.error) tested.vision = /red/i.test(r.text ?? '');
```

### Threading the user cap into the probe

```ts
// src/options/model-test.ts
const stored = provider.models.find(m => m.name === modelName);
const spec = {
  kind: provider.kind, modelName, apiKey, baseUrl: provider.baseUrl,
  maxOutputTokens: stored?.overrides?.maxOutput,
};
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error body extraction | Custom fetch wrapper | `errorText` / `getApiCallResponseBody` in `src/llm/errors.ts` | SDK already exposes `responseBody` on `APICallError`; reusing keeps 400 surfaces consistent. |
| Token estimation on null usage | New estimator in probes | Optional chaining + existing loop/context estimation | Probes only read usage opportunistically; estimation lives in the agent loop. |
| Retry loop for CUT_SHORT | Generic retry helper | Inline single retry at 4096 | Decision fixes exactly one retry at the full cap; a generic helper risks extra calls. |

## Common Pitfalls

### Pitfall 1: Reasoning models marked `noToolCalling`
**What goes wrong:** Fixed 1024 cap exhausted by reasoning; `CUT_SHORT` treated as definitive.
**How to avoid:** Size from user cap and retry at 4096 before recording failure.
**Warning signs:** `CUT_SHORT` only on reasoning models; a model that works elsewhere is unselectable.

### Pitfall 2: Vision false positives
**What goes wrong:** Any 200 sets `vision = true`, even generic answers.
**How to avoid:** Require "red" in the answer; non-match yields `false`.
**Warning signs:** Screenshot tool enabled for text-only models; 400s on image parts at run time.

### Pitfall 3: 400 body stripped
**What goes wrong:** Surfacing only `error.message` loses the server's exact reason.
**How to avoid:** Keep `errorText` (appends body) and `result.error.message` as the surfaced string; do not replace with a generic label.
**Warning signs:** UI shows "Bad Request" with no detail.

### Pitfall 4: Probe crashes on null usage
**What goes wrong:** Accessing `r.usage.reasoning` when usage is null.
**How to avoid:** Optional chaining (`r.usage?.reasoning ?? 0`) and treat null as "no signal".
**Warning signs:** TypeError in the effort probe on servers that omit usage.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed 1024 probe cap | `Math.max(1024, userMaxOutput)` capped 4096 + retry | Phase 3 | Fewer false `noToolCalling`. |
| Any 200 = vision | Requires "red" | Phase 3 | Fewer false vision positives. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hidden tests pass `userMaxOutput` via `spec.maxOutputTokens` rather than a new parameter | Standard Stack / Code Examples | If tests use a different channel, the cap logic must be re-wired in `testModel`/`testConnection`. |
| A2 | A non-matching vision 200 should set `vision = false` rather than leave it unset | Common Pitfalls | If "unknown" is expected instead, profile falls back to catalogue/base vision and may re-enable the screenshot tool. |
| A3 | Existing effort/None probes need no change beyond keeping usage optional | Summary | If a new probe is expected, additional request bodies will be asserted by tests. |

## Open Questions

1. **Retry accounting on a successful retry:** Should subsequent probes (effort/None/image) run after a 4096 retry? Current design runs them with the updated 4096 cap. If tests expect the original cap for probes, adjust `cap` handling.
2. **Exact 400 surfacing contract:** Whether `ConnectionResult.error` must equal the raw body string or may include the SDK message prefix. The code keeps `errorText`'s combined form; if tests assert exact equality, strip the prefix for 400s.

## Environment Availability

No new external dependencies. Existing toolchain (pnpm, Vitest, WXT) sufficient.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Probe inputs are fixed constants; user `MAX_TOKENS` already validated in Phase 1. |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Probe response treated as instructions | Tampering | Page content boundaries unchanged; probe answers are discarded except for a colour match. |

## Sources

### Primary (HIGH confidence)
- `src/llm/connection.ts` (read this session) — `testConnection`, `CUT_SHORT`, `PROBE_IMAGE`, image probe.
- `src/llm/stream.ts` (read this session) — `streamTurn`, `toUsage`, `TurnResult`.
- `src/llm/errors.ts` (read this session) — `errorText`, `getApiCallResponseBody`.
- `src/options/model-test.ts` (read this session) — `testModel`, `saveTest`.
- `src/llm/profiles.ts` (read this session) — `probeAsk`, `resolveProfile`.

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` — Pitfalls 5, 6, 7.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - unchanged repo stack.
- Architecture: HIGH - code paths read directly.
- Pitfalls: HIGH - tied to documented pitfalls and code.

**Research date:** 2026-10-31
**Valid until:** 2026-11-30
