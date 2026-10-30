# Phase 2: Profile Wiring & Validation - Research

**Researched:** 2026-10-30
**Domain:** Per-model profile resolution, override clamping, local-endpoint concurrency
**Confidence:** HIGH

## User Constraints (from CONTEXT.md)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** User-entered context window is clamped to the server-reported value when both exist: `Math.min(override, fromApi)`. — **Reversibility:** reversible
- **D-02:** `requestOutputLimit` honors the user's cap: floor `Math.min(profile.maxOutput, 1024)` (never below 1024? Actually floor the user cap down to at least 1024? Research says floor `Math.min(profile.maxOutput, 1024)`). — **Reversibility:** reversible
- **D-03:** Overrides must survive `withBaseUrl` (already preserves) and `saveTest` merges — add regression tests. — **Reversibility:** reversible
- **D-04:** Local custom endpoints (localhost/127.0.0.1/[::1]) get `maxConcurrent: 1` via `isCloudEndpoint(kind, baseUrl)`. — **Reversibility:** reversible

### the agent's Discretion
- Exact clamping helpers and test structure.

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMOD-04 | Per-model limits feed `resolveProfile` (context window, max output) used by the agent loop and compaction | Clamping in `resolveProfile` (D-01); `requestOutputLimit` honors user cap (D-02); overrides survive `withBaseUrl`/`saveTest` (D-03); local concurrency (D-04) |

## Summary

Phase 2 is wiring and hardening, not new infrastructure. The data model (`ProfileOverrides`, `ModelEntry`, `withBaseUrl`) and the profile resolver (`resolveProfile`) already exist and `resolveModel` already passes `overrides` into `resolveProfile`. What is missing is safety: a user-entered context window can exceed the server-reported value and silently disable compaction; `requestOutputLimit` can raise a deliberately small cap above the user's value; and `openai-compatible` endpoints pointed at localhost get unlimited concurrency. There is also a verification gap: no regression test proves overrides survive `withBaseUrl` and `saveTest`.

The fixes are small and localized: clamp the override against `fromApi` in `resolveProfile`; rework `requestOutputLimit` so the user's cap is authoritative with a floor of `Math.min(profile.maxOutput, 1024)`; switch the concurrency branch in `src/extension/models.ts` from `LOCAL_KINDS.has(kind)` to `!isCloudEndpoint(kind, baseUrl)`. Add regression tests in `profiles.test.ts` and a settings test file.

**Primary recommendation:** Implement the three code edits above, then add the regression tests; do not touch UI (Phase 1 owns it) and do not change the precedence chain beyond clamping.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Per-model limit resolution (context/maxOutput/vision) | API / Backend (agent loop) | — | `resolveProfile` is consumed by `resolveModel` in the worker; compaction and the agent loop read `profile` |
| Clamping user override to server fact | API / Backend | — | Pure function in `src/llm/profiles.ts`, no browser dependency |
| Concurrency limiting for local endpoints | API / Backend | — | `withSlot` in `src/llm/limiter.ts`, invoked from `stream.ts` using `maxConcurrent` from `ModelSpec` |
| Override persistence across base-URL change | Browser storage layer | — | `withBaseUrl` in `src/store/settings.ts` strips learned facts, keeps user-owned `overrides` |

## Standard Stack

No new dependencies. All changes are edits to existing in-repo modules.

| Library / Module | Version | Purpose | Why Standard |
|-----------------|---------|---------|--------------|
| `src/llm/profiles.ts` | in-repo | `resolveProfile`, `requestOutputLimit`, `probeAsk` | Canonical profile resolution; precedence chain documented in file header |
| `src/store/settings.ts` | in-repo | `ModelEntry`, `ProfileOverrides`, `withBaseUrl`, `saveTest` caller | Owns user-owned overrides vs. server-learned facts split |
| `src/llm/model-info.ts` | in-repo | `isCloudEndpoint`, `factsFrom`, `readModelInfo` | `isCloudEndpoint(kind, baseUrl)` already classifies localhost/127.0.0.1/[::1] as non-cloud |
| `src/llm/limiter.ts` | in-repo | `withSlot(key, max, fn)` | Queues requests per server slot |
| `src/extension/models.ts` | in-repo | `resolveModel` | Builds `ModelSpec` with `maxConcurrent` |
| `src/options/model-test.ts` | in-repo | `saveTest` | Merges a test patch into a model entry |

**Installation:** none.

## Package Legitimacy Audit

N/A — Phase 2 adds no external packages. All changes are edits to existing in-repo modules. No legitimacy check required.

## Architecture Patterns

### Recommended Project Structure

No structural change; edits land in existing files:
```
src/llm/profiles.ts          # resolveProfile clamp; requestOutputLimit rework
src/extension/models.ts      # concurrency branch + imports
src/llm/__tests__/profiles.test.ts   # new clamp/cap assertions
src/store/__tests__/...      # overrides-survive regression tests (new or extend live-pair.test.ts)
src/options/__tests__/...    # saveTest merge regression test (new)
```

### Pattern 1: Clamping the user override to the server fact (D-01)

**What:** When both `overrides.contextWindow` and `fromApi.contextWindow` exist, take `Math.min(override, fromApi)`. `detectedContext` (local server's loaded window) already lowers via `Math.min` and stays.

**Where:** `src/llm/profiles.ts`, `resolveProfile`, the `contextWindow` line:

```ts
// Current (src/llm/profiles.ts:93) [VERIFIED: src/llm/profiles.ts:90-108]:
contextWindow: overrides?.contextWindow || tested?.contextWindow || fromApi?.contextWindow || base.contextWindow,
```

**Recommended edit:**

```ts
const overrideContext = overrides?.contextWindow;
const apiContext = fromApi?.contextWindow;
let contextWindow: number;
if (overrideContext && apiContext) {
  contextWindow = Math.min(overrideContext, apiContext);
} else {
  contextWindow = overrideContext || tested?.contextWindow || apiContext || base.contextWindow;
}
// assign to profile.contextWindow, then apply detectedContext lowering (existing):
if (input.detectedContext && input.detectedContext > 0) {
  profile.contextWindow = Math.min(profile.contextWindow, input.detectedContext);
}
```

**Rationale:** The override becomes a ceiling on top of server facts, never a floor. `tested` (probe/run fallback) is treated as a server-derived value and is not clamped against (it already reflects reality).

**Edge cases to preserve:**
- Override only (no `fromApi`): override wins (existing behavior) — user is the only source.
- `fromApi` only: `fromApi` wins.
- `detectedContext` present: still `Math.min` (existing, unchanged).
- `maxOutput` still clamped to `contextWindow` via existing `profile.maxOutput = Math.min(profile.maxOutput, profile.contextWindow)`.

### Pattern 2: `requestOutputLimit` honors the user's cap (D-02)

**What:** The user's `maxOutput` is authoritative; the 1024 floor must never exceed it.

**Current (`src/llm/profiles.ts:130-132`):**

```ts
export function requestOutputLimit(profile: ModelProfile): number {
  return Math.max(1024, Math.min(profile.maxOutput, 16_384, Math.floor(profile.contextWindow / 4)));
}
```

**Recommended edit:**

```ts
export function requestOutputLimit(profile: ModelProfile): number {
  const capped = Math.min(profile.maxOutput, 16_384, Math.floor(profile.contextWindow / 4));
  const floor = Math.min(profile.maxOutput, 1024);
  return Math.max(floor, capped);
}
```

**Behavior:** result is always `<= profile.maxOutput` (both terms are `<= maxOutput`) and `>= min(maxOutput, 1024)`. A 512 override yields `<= 512` (satisfies the pitfall test). Existing tests still pass: 8192-window ollama → 2048; claude-sonnet → 16384.

### Pattern 3: Overrides survive `withBaseUrl` and `saveTest` (D-03)

**Current state (verified):**
- `withBaseUrl` (`src/store/settings.ts:129-136`) already maps `{ name, overrides }` only, dropping `tested`/`fromApi`/`detectedContext`/`noToolCalling`. Regression test exists partially in `live-pair.test.ts:67-85` (asserts `overrides: { vision: true }` survives).
- `saveTest` (`src/options/model-test.ts:55-77`) starts from `m` (which carries `overrides`), spreads `...kept` (overrides intact), then `...rest` (no `overrides` key in `rest`), then `tested`. Overrides survive.

**Action:** add regression tests only; no code change expected unless a test fails. Concretely:
- Extend `src/extension/__tests__/live-pair.test.ts` (or new `src/store/__tests__/settings.test.ts`): assert `withBaseUrl(provider, newUrl).models[0].overrides` deep-equals original when URL differs; assert equal-URL returns same reference.
- New `src/options/__tests__/model-test.test.ts`: construct a provider/model with overrides, call `saveTest` with a patch (fake chrome storage + fake-indexeddb, as in `live-pair.test.ts`), assert overrides remain.

**Important `capabilityOf` gap:** `src/store/settings.ts:214-226` calls `resolveProfile` with `...learnt(found.model)` but does **not** pass `overrides`. Acceptable because `capabilityOf` returns only `.reasoning`, and overrides do not affect reasoning. No change needed. Note for Phase 4: pass `overrides` where vision matters (`resolveModel` already does, verified `models.ts:70-77`).

### Pattern 4: Local concurrency via `isCloudEndpoint` (D-04)

**Current (`src/extension/models.ts:84-85`):**

```ts
...(LOCAL_KINDS.has(found.provider.kind) ? { maxConcurrent: 1 } : {}),
```

**Recommended edit:**

```ts
...(!isCloudEndpoint(found.provider.kind, found.provider.baseUrl) ? { maxConcurrent: 1 } : {}),
```

with import `isCloudEndpoint` added to the `@src/llm` import in `models.ts` (line 3) and the now-unused `LOCAL_KINDS` import removed from the `@src/store/settings` import (line 11). `isCloudEndpoint` is exported from `src/llm/index.ts`.

**Why this works:** `isCloudEndpoint` returns `false` for `ollama`/`lmstudio` (local kinds) and for `openai-compatible` at `localhost`/`127.0.0.1`/`[::1]`/private hosts (verified `src/llm/catalogue.ts:217-240`). It returns `true` for public cloud hosts. So any local endpoint gets `maxConcurrent: 1`.

**Slot key unchanged:** `withSlot` is keyed `${kind} ${baseUrl}` (`src/llm/stream.ts:181`), so different local servers do not share a slot.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Endpoint locality classification | A new host-parsing helper | `isCloudEndpoint(kind, baseUrl)` (existing) | Already handles IPv4 private ranges, `.local`, bracketed IPv6 `[::1]`, missing host |
| Concurrency slot queue | A new limiter | `withSlot` in `src/llm/limiter.ts` | Already supports abort, queue, slot accounting |
| Override merge on save | Re-implementing merge logic | Existing `saveTest` merge (`{ ...kept, ...rest, tested }`) | Already preserves `overrides`; only needs a test |
| Base-URL fact clearing | Custom clearing | `withBaseUrl` (existing) | Already preserves `overrides` while clearing learned facts |

**Key insight:** All four fixes reuse existing primitives; the risk is in the wiring (passing the right predicate, clamping at the right point), not in new code.

## Common Pitfalls

### Pitfall 1: Override exceeds server fact silently disables compaction
**What goes wrong:** `resolveProfile` takes `overrides.contextWindow` first; an inflated value wins over `fromApi.context_length`.
**How to avoid:** D-01 clamp (`Math.min(override, fromApi)`). Warning signs: no compaction summaries, context-overflow 400s.

### Pitfall 2: `requestOutputLimit` exceeds user cap
**What goes wrong:** `Math.max(1024, …)` raises a 512 cap to 1024.
**How to avoid:** D-02 floor `Math.min(profile.maxOutput, 1024)`. Test: 512 override → `<= 512`.

### Pitfall 3: Local custom endpoints unlimited concurrency
**What goes wrong:** `LOCAL_KINDS.has(kind)` misses `openai-compatible` at localhost.
**How to avoid:** D-04 `!isCloudEndpoint(kind, baseUrl)`.

### Pitfall 4: Overrides lost on base-URL change
**What goes wrong:** Spreading the whole entry in `withBaseUrl` would wipe overrides.
**How to avoid:** Already preserved; regression test locks it.

### Pitfall 5: `saveTest` replacing instead of merging
**What goes wrong:** A careless `saveTest` could overwrite `overrides` if it spreads patch over the whole model.
**How to avoid:** Verified it merges; regression test locks it.

## Code Examples

### Clamped resolveProfile (target)

```ts
// src/llm/profiles.ts
export function resolveProfile(input: ProfileInput): ModelProfile {
  const { cloud, row, reasons, acceptsNone } = reasoningFacts(input);
  const base = row ?? (cloud ? defaults.cloud : defaults.local);
  const { tested, fromApi, overrides } = input;
  // Clamp the user override to the server-reported value when both exist.
  const overrideContext = overrides?.contextWindow;
  const apiContext = fromApi?.contextWindow;
  let contextWindow: number;
  if (overrideContext && apiContext) {
    contextWindow = Math.min(overrideContext, apiContext);
  } else {
    contextWindow = overrideContext || tested?.contextWindow || apiContext || base.contextWindow;
  }
  const profile: ModelProfile = {
    contextWindow,
    maxOutput: overrides?.maxOutput || tested?.maxOutput || fromApi?.maxOutput || base.maxOutput,
    vision: overrides?.vision ?? tested?.vision ?? fromApi?.vision ?? base.vision,
  };
  // ... reasoning, wire, detectedContext lowering, maxOutput clamp, countFactor unchanged
}
```

### requestOutputLimit (target)

```ts
// src/llm/profiles.ts
export function requestOutputLimit(profile: ModelProfile): number {
  const capped = Math.min(profile.maxOutput, 16_384, Math.floor(profile.contextWindow / 4));
  const floor = Math.min(profile.maxOutput, 1024);
  return Math.max(floor, capped);
}
```

### Concurrency branch (target)

```ts
// src/extension/models.ts
import { createModel, detectContext, isCloudEndpoint, makePair, resolveProfile } from '@src/llm';
// ...
const chat = createModel({
  kind: found.provider.kind,
  modelName: found.model.name,
  apiKey: keys[found.provider.id],
  baseUrl: found.provider.baseUrl,
  maxOutputTokens: profile.maxOutput,
  ...(!isCloudEndpoint(found.provider.kind, found.provider.baseUrl) ? { maxConcurrent: 1 } : {}),
});
```

And remove the now-unused `LOCAL_KINDS` from the `@src/store/settings` import block.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Trust user override verbatim | Clamp to server fact | Phase 2 | Prevents silent overflow |
| Fixed 1024 floor in `requestOutputLimit` | Floor `min(maxOutput, 1024)` | Phase 2 | Respects small caps |
| Concurrency keyed to `kind` only | Keyed to `isCloudEndpoint(kind, baseUrl)` | Phase 2 | Local custom endpoints safe |

**Deprecated/outdated:**
- `LOCAL_KINDS.has(kind)` as the concurrency predicate in `models.ts` (replaced by `isCloudEndpoint`).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Clamping only applies override vs. `fromApi`, not vs. `tested` | Pattern 1 | If `tested.contextWindow` can be smaller than an inflated override, compaction still breaks. Mitigation: `detectedContext` already lowers; but `tested` from a run is not a server fact. Could additionally clamp against `tested` if present. Planner may choose stricter `Math.min(override, tested ?? fromApi)` — but D-01 literally says `fromApi`. |
| A2 | No code change needed in `saveTest`/`withBaseUrl` | Pattern 3 | If a hidden path replaces the entry, overrides could still be lost. Regression tests will surface. |
| A3 | `isCloudEndpoint` correctly returns false for `[::1]` | Pattern 4 | Verified by reading `src/llm/catalogue.ts:217-240` (`host.includes('.')` false for `::1`). |
| A4 | `LOCAL_KINDS` becomes unused in `models.ts` after edit | Pattern 4 | Verified by grep: only two references, both in `models.ts`. Removing import avoids lint failure. |

## Open Questions

1. **Should `tested.contextWindow` also clamp the override?**
   - What we know: D-01 says `Math.min(override, fromApi)`.
   - What's unclear: A run-learned `tested` value could be a tighter bound.
   - Recommendation: Follow D-01 literally (`fromApi`); keep `detectedContext` lowering. Revisit if tests show overflow on run-learned values.

2. **Where should the override-survive regression tests live?**
   - What we know: No `settings.test.ts` or `model-test.test.ts` exists yet.
   - Recommendation: Extend `src/extension/__tests__/live-pair.test.ts` for `withBaseUrl`; create `src/options/__tests__/model-test.test.ts` for `saveTest`, mirroring the fake-chrome/fake-indexeddb setup.

3. **Does `capabilityOf` need overrides passed?**
   - What we know: It returns only reasoning; overrides don't affect reasoning.
   - Recommendation: No change in Phase 2; revisit in Phase 4 for vision gating.

## Environment Availability

No external dependencies. Phase is pure code/test changes in the existing Vitest suite.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/test | ✓ | >=24.22.1 (engines) | — |
| pnpm | scripts | ✓ | 10.34.7 (pinned) | corepack |
| Vitest | tests | ✓ | 5.0.5 | — |

**Missing dependencies with no fallback:** none.

## Security Domain

Security enforcement is enabled (config: `security_enforcement: true`, ASVS level 1).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Clamp user override to server fact (D-01); range validation already in Phase 1 UI |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Inflated context window causing silent overflow / compaction bypass | Tampering (data integrity) | Clamp override to server-reported `fromApi` value |
| Lost user overrides on base-URL change | Integrity | `withBaseUrl` preserves `overrides`; regression test |
| Unbounded concurrency on local endpoints (DoS of local server) | Availability | `maxConcurrent: 1` via `isCloudEndpoint` |

## Sources

### Primary (HIGH confidence)
- `src/llm/profiles.ts` (lines 88-132) — `resolveProfile`, `requestOutputLimit`, precedence chain
- `src/store/settings.ts` (lines 73-136, 214-226) — `ProfileOverrides`, `ModelEntry`, `withBaseUrl`, `capabilityOf`
- `src/llm/model-info.ts` (lines 217-240) — `isCloudEndpoint`
- `src/extension/models.ts` (lines 70-86) — `resolveModel`, concurrency branch
- `src/options/model-test.ts` (lines 55-77) — `saveTest` merge
- `src/llm/catalogue.ts` (lines 217-240) — `isCloudEndpoint` implementation
- `src/llm/limiter.ts` (lines 1-28) — `withSlot`
- `.planning/research/PITFALLS.md` (pitfalls 1-3, 10) — authoritative problem statements

### Secondary (MEDIUM confidence)
- `.planning/research/SUMMARY.md` — milestone-level summary of the four fixes
- `.planning/phases/01-settings-ui-validation/01-02-SUMMARY.md` — prior phase patterns

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all modules in-repo, read this session
- Architecture: HIGH — code paths verified by reading source
- Pitfalls: HIGH — documented in PITFALLS.md and verified against code

**Research date:** 2026-10-30
**Valid until:** 2026-11-30 (stable codebase; revisit if profiles.ts changes)
