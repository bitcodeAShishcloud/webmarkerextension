# Phase 3: Test Probe Robustness - Context

**Gathered:** 2026-10-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 hardens the test probes: tool-calling detection must not misclassify reasoning models; vision probe must require "red" in the answer; probe cap uses `Math.max(1024, userMaxOutput)` capped at 4096 with one retry at 4096 on CUT_SHORT; probe failures surface the server's exact 400 body; streaming/usage treated as optional.

</domain>

<decisions>
## Implementation Decisions

### Tool probe
- **D-01:** Tool probe uses `Math.max(1024, userMaxOutput)` capped at 4096; retries once at 4096 on CUT_SHORT before marking `noToolCalling`. — **Reversibility:** reversible

### Vision probe
- **D-02:** Vision probe requires the answer to contain "red"; a non-matching 200 yields `vision = false`/unknown, with manual override authoritative. — **Reversibility:** reversible

### Error surfacing
- **D-03:** Probe failures surface the server's exact 400 body. — **Reversibility:** reversible
- **D-04:** Streaming/usage is treated as optional (estimate when null). — **Reversibility:** reversible

### Claude's Discretion
- Exact retry and estimation implementation.

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

- `src/llm/connection.ts` — `testConnection`, `readModelInfo`
- `src/llm/model-info.ts` — `factsFrom`
- `src/options/model-test.ts` — `testModel`, `saveTest`, `probeAsk`
- `src/llm/profiles.ts` — `probeAsk`, `resolveProfile`
- `.planning/research/PITFALLS.md`

</canonical_refs>

<code_context>
## Existing Code Insights
- Probe already exists; needs robustness fixes.

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
*Phase: 03-test-probe-robustness*
*Context gathered: 2026-10-31*