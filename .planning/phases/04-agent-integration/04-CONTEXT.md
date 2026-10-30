# Phase 4: Agent Integration - Context

**Gathered:** 2026-10-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 verifies end-to-end agent runs on a custom tool-calling model: screenshot tool registered only when `profile.vision === true`, context management degrades gracefully when usage is null, CORS-blocked endpoints surface a distinct status-0 error and document origin allowance.

</domain>

<decisions>
## Implementation Decisions

### Screenshot gating
- **D-01:** Screenshot tool registered only when `profile.vision === true`; verified by a test flipping `overrides.vision`. — **Reversibility:** reversible

### Usage-null degradation
- **D-02:** Context management degrades gracefully (estimation) when usage comes back null. — **Reversibility:** reversible

### CORS handling
- **D-03:** CORS-blocked endpoints surface a distinct status-0 error and document origin allowance. — **Reversibility:** reversible

### Claude's Discretion
- Exact error handling and docs.

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

- `src/agent/loop.ts` — agent loop, tool registration
- `src/agent/context.ts` — context management
- `src/extension/models.ts` — resolveModel
- `src/llm/profiles.ts` — profile.vision
- `src/options/OriginFix` — CORS guidance
- `.planning/research/PITFALLS.md`

</canonical_refs>

<code_context>
## Existing Code Insights
- Agent loop already consumes profile.vision for screenshot tool gating (verify).
- streamTurn returns null usage; loop handles `if (reply.usage)`.

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
*Phase: 04-agent-integration*
*Context gathered: 2026-10-31*