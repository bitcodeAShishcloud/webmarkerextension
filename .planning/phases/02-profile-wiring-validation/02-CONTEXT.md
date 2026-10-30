# Phase 2: Profile Wiring & Validation - Context

**Gathered:** 2026-10-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 wires per-model limits and vision into `resolveProfile` safely: clamp user-entered context window to the server-reported value, make `requestOutputLimit` honor the user's cap, ensure overrides survive `withBaseUrl` and `saveTest`, and give local custom endpoints (`localhost`/`127.0.0.1`/`[::1]`) a `maxConcurrent` of 1 via `isCloudEndpoint`. No UI changes (Phase 1 owns those).

</domain>

<decisions>
## Implementation Decisions

### Clamping
- **D-01:** User-entered context window is clamped to the server-reported value when both exist: `Math.min(override, fromApi)`. — **Reversibility:** reversible
- **D-02:** `requestOutputLimit` honors the user's cap: floor `Math.min(profile.maxOutput, 1024)` (never below 1024? Actually floor the user cap down to at least 1024? Research says floor `Math.min(profile.maxOutput, 1024)`). — **Reversibility:** reversible

### Overrides survival
- **D-03:** Overrides must survive `withBaseUrl` (already preserves) and `saveTest` merges — add regression tests. — **Reversibility:** reversible

### Local concurrency
- **D-04:** Local custom endpoints (localhost/127.0.0.1/[::1]) get `maxConcurrent: 1` via `isCloudEndpoint(kind, baseUrl)`. — **Reversibility:** reversible

### Claude's Discretion
- Exact clamping helpers and test structure.

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

- `src/llm/profiles.ts` — `resolveProfile`, `probeAsk`, precedence chain
- `src/store/settings.ts` — `ModelEntry`, `ProfileOverrides`, `withBaseUrl`, `learnFacts`
- `src/llm/model-info.ts` — `factsFrom`, `readModelInfo`, `isCloudEndpoint`
- `src/llm/limiter.ts` — concurrency limiter
- `src/extension/models.ts` — `resolveModel`
- `.planning/codebase/CONVENTIONS.md`

</canonical_refs>

<code_context>
## Existing Code Insights
- `resolveProfile` already consumes overrides with highest precedence.
- `withBaseUrl` already preserves overrides.
- `isCloudEndpoint` classifies endpoints.

</code_context>

<specifics>
## Specific Ideas
None.

</specifics>

<deferred>
## Deferred Ideas
None.

</deferred>

---
*Phase: 02-profile-wiring-validation*
*Context gathered: 2026-10-30*