# Phase 4: Agent Integration - Research

**Researched:** 2026-10-31
**Domain:** Agent loop integration with custom tool-calling models (vision gating, usage-null degradation, CORS status-0)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Screenshot tool registered only when `profile.vision === true`; verified by a test flipping `overrides.vision`. — Reversibility: reversible
- **D-02:** Context management degrades gracefully (estimation) when usage comes back null. — Reversibility: reversible
- **D-03:** CORS-blocked endpoints surface a distinct status-0 error and document origin allowance. — Reversibility: reversible

### the agent's Discretion
- Exact error handling and docs.

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMOD-12 | A custom model with tool calling can be selected as the default model and used to run the agent | `resolveModel` already throws `ModelUnavailable` for `noToolCalling` models (`src/extension/models.ts:43-45`); run path uses `toolsForRun({ vision: model.profile.vision })` (`run-manager.ts:1302`); screenshot gating via `profile.vision === true`; usage-null degradation in `loop.ts:889-893`; CORS status-0 surfaces as network error notice (`run-manager.ts:1339`). Phase 4 closes the verification gaps: strict `=== true` gating, null-usage stream guard, distinct status-0 notice, tests, and end-to-end run. |
</phase_requirements>

## Summary

Phase 4 is the final integration gate for the custom-model milestone. The production code already wires most of what CMOD-12 needs: `resolveModel` rejects models flagged `noToolCalling`, `toolsForRun` drops the `screenshot` tool unless vision is on, the loop updates its token estimate only when usage is present (falling back to 4-chars-per-token estimation), and a CORS-blocked request arrives as a `TypeError`/status-undefined network error whose message is shown as an error notice. What remains is verification hardening and a few small robustness fixes that the research surfaced:

1. **Screenshot gating** is implemented with a truthy check (`options.vision`) in `toolsForRun` (`src/agent/tools.ts:128`). Because the value comes from `model.profile.vision` (a boolean) this is functionally correct, but the pitfall (Pitfall 8) and the requirement ask for an explicit `=== true`. A new unit test must flip `overrides.vision` and assert screenshot presence/absence on the next run. No such test exists yet.
2. **Usage-null degradation** works at the loop level (`if (reply.usage)`), but the streaming layer (`src/llm/stream.ts:249-254`) calls `toUsage(part.usage)` without guarding against `undefined`, which will crash when a server omits usage entirely. `ScriptedModel` always emits usage, so null-usage paths are untested. Both need fixing so the degradation path is exercisable.
3. **CORS status-0** surfaces only as the raw provider error text in the run notice (`run-manager.ts:1339`). A distinct, origin-focused message (mirroring `listProblem`/`OriginFix`) is needed for agent runs, plus documentation of the extension-origin allowance. `isOriginRefused` already exists (`errors.ts:63-67`) but is only consulted by `listModels`/`testConnection`, not by `streamTurn`.
4. **End-to-end run** on a strict server is a manual/autorun check; the milestone summary explicitly flags this as not yet covered.

**Primary recommendation:** Make the three small robustness edits (strict `=== true` gating, stream null-usage guard, ScriptedModel null-usage support, distinct status-0 notice), add the screenshot-gating and null-usage tests, document the origin allowance in the side panel/Settings, and run the `model-config`-style autorun check end to end.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Screenshot tool registration | Agent (in-process) | — | Tool set built per run from freshly resolved `profile.vision` (`run-manager.ts:1302`); no caching across runs |
| Usage accounting / context estimate | Agent loop | LLM stream | Loop owns `#reported` and falls back to chars/4 when usage is null |
| CORS / origin handling | Browser (service worker fetch) | Settings UI | No proxy exists (AGENTS.md); endpoint must allow `chrome-extension://` origin; status-0 surfaced as network error |
| Model selection / default | Extension (worker) + Settings | — | `usableModel`/`resolveModel` gate on `noToolCalling`; picker writes live pair + settings |

## Standard Stack

No new dependencies are required for this phase. The phase reuses the existing stack.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | (pinned) | `streamText`, `toUsage` inputs | Chat-completions path already used |
| Vitest | 5.0.5 | Unit tests | Project standard |
| WXT | 0.21.4 | Extension build/test harness | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ScriptedModel` (`src/llm/scripted.ts`) | in-repo | Fake provider for loop tests | Simulating null-usage and error replies |

**Installation:** none — no new packages.

## Package Legitimacy Audit

No external packages are introduced in this phase. All dependencies are already present and audited in prior phases.

| Package | Registry | Verdict | Disposition |
|---------|----------|---------|-------------|
| (none) | — | — | No installs |

## Architecture Patterns

### Pattern 1: Freshly resolved profile drives tool set
**What:** `toolsForRun({ vision: model.profile.vision })` is called inside `#launch` after `resolveModel` returns (`run-manager.ts:1302`), so the screenshot tool reflects the current `overrides.vision`/`tested.vision`/`fromApi.vision` chain.
**When to use:** Every run start and every compaction (`#compact`, `run-manager.ts:1133`).
**Example:**
```typescript
// src/extension/run-manager.ts:1302
const tools = toolsForRun({ vision: model.profile.vision });
```

### Pattern 2: Usage-null degradation via char estimation
**What:** The loop keeps `#reported` only when `reply.usage` is present (`loop.ts:889-893`). When null, `estimate()` uses `(request.chars / 4) * countFactor` (`loop.ts:343-347`), and the silent-overflow check guards with `!!reply.usage` (`loop.ts:797`).
**When to use:** Always — no branching needed; the null case falls out naturally.

### Pattern 3: Status-0 / network error surfacing
**What:** `streamTurn` returns `error: { status, overflow, network }` where `network` is true for a `TypeError` (fetch failure). The loop ends the run with `cause: 'provider'` and `reason: message`. `run-manager.ts:1339` writes the reason as an error notice.
**When to use:** Agent runs against CORS-blocked endpoints.

### Anti-Patterns to Avoid
- **Caching `profile.vision` across runs:** Tool set must be rebuilt per run from the freshly resolved profile (Pitfall 8).
- **Truthiness instead of `=== true` for gating:** Use `profile.vision === true` per the requirement; the current `options.vision` is a boolean so it is safe, but tighten to be explicit.
- **Calling `toUsage(undefined)`:** Guard `part.usage` before conversion (stream.ts) to avoid a crash on servers that omit usage.
- **Treating null usage as a crash:** Always fall back to char-based estimation.

## Common Pitfalls

### Pitfall 1: Screenshot gating uses a stale profile
**What goes wrong:** Tool set built once at startup keeps old gating after `overrides.vision` changes.
**How to avoid:** Build tool set inside `resolveModel`/run setup using freshly resolved `profile.vision`; gate with `=== true`. Test by flipping `overrides.vision`.
**Warning signs:** Screenshot tool present for text-only model, or absent for VLM.

### Pitfall 2: `toUsage` crashes on missing usage
**What goes wrong:** `stream.ts:250` calls `toUsage(part.usage)`; if the SDK omits `part.usage`, `toUsage(undefined)` throws.
**How to avoid:** Guard: `if (part.usage) usage = toUsage(part.usage);` (and same for `totalUsage`).
**Warning signs:** Unhandled exception in stream on strict/odd servers.

### Pitfall 3: CORS-blocked agent run shows a raw TypeError
**What goes wrong:** The run notice displays `Failed to fetch` with no origin hint, so users cannot tell it is a CORS block.
**How to avoid:** Detect `status === undefined && network === true` and show a distinct origin-allowance message (mirroring `listProblem`/`OriginFix`); document that the endpoint must allow the `chrome-extension://` origin (or `*`).
**Warning signs:** Status-0 / "Failed to fetch" while curl works.

### Pitfall 4: Null usage leaves `#reported` stale
**What goes wrong:** If a null-usage turn is followed by a reported-usage turn, the delta calculation uses a stale `#reported.chars`; already handled by `if (reply.usage)` setting `#reported`, but verify no code path sets it on null.
**How to avoid:** Confirm `#reported` is set only inside `if (reply.usage)` (loop.ts:892). Keep it that way.

## Code Examples

### Screenshot gating (current)
```typescript
// src/agent/tools.ts:122-130
export function toolsForRun(options: { disabled?: readonly string[]; vision: boolean; agentTools?: AgentTool[] }): AgentTool[] {
  return allTools(options.agentTools).filter(
    t => (t.required || !options.disabled?.includes(t.name)) && (t.name !== 'screenshot' || options.vision),
  );
}
```

### Usage-null guard in stream (recommended fix)
```typescript
// src/llm/stream.ts:249-254 (current)
case 'finish-step':
  usage = toUsage(part.usage);
  break;
case 'finish':
  finish = part.finishReason;
  usage = usage ?? toUsage(part.totalUsage);
  break;
// recommended:
case 'finish-step':
  if (part.usage) usage = toUsage(part.usage);
  break;
case 'finish':
  finish = part.finishReason;
  if (!usage && part.totalUsage) usage = toUsage(part.totalUsage);
  break;
```

### Distinct status-0 notice (recommended)
```typescript
// src/extension/run-manager.ts:1339 (current)
if (end.status === 'failed' && end.reason) await this.#notice(conversationId, end.reason, 'error');
// recommended: detect network/CORS and append origin guidance
const reason = end.providerError?.network && end.providerError?.status === undefined
  ? `${end.reason ?? 'Could not reach the model.'} — the endpoint must allow requests from browser extensions (CORS); see Settings → Providers.`
  : end.reason;
if (end.status === 'failed' && reason) await this.#notice(conversationId, reason, 'error');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Screenshot tool always registered | Registered only when `profile.vision === true` | Phase 4 | Avoids 400s on text-only models |
| Usage assumed present | Char-based estimation fallback | Phase 4 | Runs complete on servers that omit usage |

**Deprecated/outdated:**
- Fixed 1024 probe cap: replaced by sized cap + 4096 retry (Phase 3).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ScriptedModel` can be extended to emit `usage: null` by omitting the usage block, requiring a stream guard first | Code Examples | If the SDK always provides usage, the null path remains untestable; mitigation: add an explicit `usage: null` flag to `ScriptedReply` |
| A2 | End-to-end run on a strict CORS gateway is manual (no automated check exists) | Summary | If a gateway is unavailable, document the limitation per milestone summary |
| A3 | `profile.vision` is always a boolean (never undefined) at run time | Architecture Patterns | `resolveProfile` falls back to `base.vision` (catalogue/default), which is boolean; if a catalogue row is missing, `defaults.*.vision` is boolean — safe |

## Open Questions

1. **Should the status-0 notice reuse `models.fix.generic` i18n text?**
   - What we know: `OriginFix` already documents origin allowance in Settings.
   - What's unclear: Whether run-manager should call into i18n or use a plain string (it currently uses raw strings in `#notice`).
   - Recommendation: Use a plain string consistent with `#notice` usage; add an i18n key only if the side panel renders it as a translated notice.

2. **Does `ScriptedModel` need a new `usage` flag or a `null` sentinel?**
   - What we know: `ScriptedReply.usage` is optional and defaults to 100/10.
   - What's unclear: Cleanest representation of "no usage".
   - Recommendation: Add `usage?: { input; output; reasoning? } | null` and, when `null`, omit the `usage` field from the finish part (plus the stream guard).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/test | ✓ | 24 LTS | — |
| pnpm | build/test | ✓ | 10.34.7 | — |
| Chrome for Testing | autorun/E2E | ✓ (via pnpm install-chrome) | stable | manual E2E on dev build |
| Fixture server | E2E checks | ✓ | port 8787 | — |

**Missing dependencies with no fallback:** none.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Base URL scheme/host validation already in Settings (Phase 1) |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key leakage in error messages | Information Disclosure | `spec.apiKey` never reaches console/error text (audit) |
| CORS bypass attempts | Tampering | No proxy; endpoint must allow extension origin; status-0 surfaced distinctly |
| Prompt injection via page content | Tampering | Page content stays inside marked boundaries (AGENTS.md) |

## Sources

### Primary (HIGH confidence)
- `src/agent/tools.ts:122-130` — `toolsForRun` screenshot gating
- `src/agent/loop.ts:343-347, 797, 889-893` — estimate fallback, silent overflow guard, usage handling
- `src/extension/models.ts:37-90` — `resolveModel`, `noToolCalling` gate
- `src/extension/run-manager.ts:1133, 1302, 1339` — tool set build, notice
- `src/llm/stream.ts:249-254` — unguarded `toUsage`
- `src/llm/profiles.ts:88-115` — `resolveProfile` vision precedence
- `src/llm/errors.ts:62-67` — `isOriginRefused`
- `src/options/ProvidersSection.tsx:998-1008` — `OriginFix`
- `src/options/model-test.ts` — `listProblem`

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` — Pitfalls 7, 8, 9
- `.planning/research/SUMMARY.md` — Phase 4 deliverables

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps
- Architecture: HIGH — verified against source
- Pitfalls: HIGH — code read this session

**Research date:** 2026-10-31
**Valid until:** 2026-11-30 (stable milestone)
