# Project Research Summary

**Project:** Nanobrowser (custom OpenAI-compatible model support)
**Domain:** OpenAI-compatible custom model support in a browser-extension AI agent (Chrome/Edge MV3)
**Researched:** 2026-10-30
**Confidence:** HIGH

## Executive Summary

Nanobrowser already speaks the OpenAI Chat Completions protocol for arbitrary endpoints through the Vercel AI SDK's `@ai-sdk/openai` provider (`createOpenAI({ baseURL, apiKey }).chat(modelId)`), and already stores per-model overrides (`contextWindow`, `maxOutput`, `vision`) on `ModelEntry`. The milestone is therefore **wiring, not new infrastructure**: the data model, profile precedence chain (`overrides → tested → fromApi → catalogue → defaults`), probe machinery (`readModelInfo`, `testConnection`, `probeAsk`), and run-time resolver (`resolveModel`) all exist. No new dependencies are required, and the extension's `host_permissions: ['<all_urls>']` already permits fetch to user-supplied base URLs.

The headline gap is user-facing: per-model `MAX_TOKENS`/`CONTEXT_WINDOW`/vision overrides exist in the data model but have no UI, and there is no per-provider enable/disable toggle or base-URL normalization for custom endpoints. Closing that gap requires four ordered phases: Settings UI & validation → profile wiring & validation → probe robustness → agent integration. The principal risks are (a) user-entered limits silently overriding safer server-reported values and breaking compaction, (b) fixed probe caps causing false "no tool calling" verdicts on reasoning models, and (c) mis-gated vision sending screenshots to text-only models. Each has a concrete, low-cost mitigation already identified in the research.

## Key Findings

### Recommended Stack

No new dependencies. The existing Vercel AI SDK OpenAI provider and the extension's storage/profile/probe machinery cover everything.

**Core technologies:**
- `@ai-sdk/openai` 4.0.101 — `createOpenAI({ baseURL, apiKey }).chat(modelId)` selects chat completions explicitly, avoiding the OpenAI-only Responses API that third-party endpoints reject.
- `ai` 7.0.150 — agent runtime for `generateText`/`streamText`, tool calling, `maxOutputTokens`; unchanged.
- `zod` 4.6.7 — reuse for validating base URLs and numeric limits in the UI.
- Chrome MV3 service worker + `chrome.storage.local` (`nb.keys`, `nb.providers`, `nb.settings`) — keys never leave the browser; no new storage layer.

**Do not add:** `@ai-sdk/openai-compatible` (duplicates the chat-completions path; breaks the no-new-dependencies constraint), the Responses API for custom endpoints, provider-level limits, or a backend proxy (CORS must be handled by endpoint origin allowance).

### Expected Features

The milestone closes the main user-facing gaps in an otherwise complete custom-model story.

**Must have (table stakes):**
- Per-model `MAX_TOKENS` (max output) + `CONTEXT_WINDOW` inputs in Settings → Providers, wired to `overrides.maxOutput`/`overrides.contextWindow`.
- Per-model vision toggle/override (`overrides.vision`).
- Detected vs. user-set value display (builds trust in auto-detection).
- Per-provider enable/disable toggle (parity with Open WebUI).
- Base URL normalization (trim trailing slash; document that the field includes `/v1`).

**Should have (competitive):**
- Auto-detect context window / max output / vision / reasoning from `/models` or vendor APIs (already implemented via `readModelInfo` + probe; keep and surface).
- Auto-probe tool calling on add (already implemented via `wholeTestOnAdd` for cloud endpoints).
- Provider presets (xAI, DeepSeek, Mistral) as first-class choices (already exists).

**Defer (v2+):**
- Local server model load/unload management (server's responsibility).
- Custom HTTP headers / auth schemes beyond Bearer (revisit on demand).
- Cost dashboards (out of scope; only OpenRouter cost tracked).
- Model ID search/filter for huge catalogues (P2; add if OpenRouter usage demands).
- Text tool-call parser for non-native-tool models (explicitly deferred; agent requires native tool calls).

### Architecture Approach

Layered fact precedence with overrides as the single user-owned field; everything else is server-learned and cleared on base-URL change.

**Major components:**
1. Provider store (`src/store/settings.ts`) — `ProviderConfig[]`, `ModelEntry.overrides`, keys by provider id; sole owner of provider data.
2. Profile resolver (`src/llm/profiles.ts`) — `resolveProfile` precedence, `requestOutputLimit`, `probeAsk`.
3. Provider factory (`src/llm/providers.ts`) — `createModel`, `openAICompatibleBaseUrl`.
4. Model API reader (`src/llm/model-info.ts`) — `readModelInfo`, `factsFrom`.
5. Connection tester (`src/llm/connection.ts`) — `testConnection`, `listModels`, tool/image probes.
6. Extension resolver (`src/extension/models.ts`) — `livePair`, `resolveModel`, local context detection.
7. Settings UI (`src/options/ProvidersSection.tsx`, `Welcome.tsx`) — provider/model UI and per-model overrides.

Key patterns: overrides are per-model (not per-provider); `probeAsk` drives only the probes still needed; `noToolCalling` strictly gates agent use; vision gating flows through `profile.vision`; `withBaseUrl` preserves overrides while clearing learned facts.

### Critical Pitfalls

1. **Inflated context window from user input** — override wins over server fact, compaction never triggers, overflow 400s mid-run. Avoid: take `Math.min(override, fromApi)` when both exist; validate ranges (1k–2M context, 256–128k max output).
2. **`requestOutputLimit` exceeds the user's cap** — `Math.max(1024, …)` floor raises a 512 override to 1024, risking strict-endpoint 400s. Avoid: make the user's cap authoritative; floor at `Math.min(profile.maxOutput, 1024)`.
3. **No concurrency limit for local custom endpoints** — `maxConcurrent: 1` is keyed to `kind` only, so a localhost `openai-compatible` (vLLM/llama.cpp/TGI) gets unlimited concurrency and 503s under parallel tool batches. Avoid: key off `isCloudEndpoint(kind, baseUrl)`.
4. **Base-URL normalization inconsistency** — `/v1` auto-append only for ollama/lmstudio; custom endpoints use raw URL, causing 404s or double slashes. Avoid: one documented contract (full URL including `/v1`, trim trailing slash only), validate scheme/host.
5. **Vision false positive** — image probe sets `vision = true` on any 200, even a wrong/generic answer. Avoid: require the answer to contain "red"; treat a non-matching 200 as `vision = false`/unknown; keep `overrides.vision` authoritative when set.
6. **Tool-calling false negative on reasoning models** — fixed 1024 probe cap; model spends budget thinking and returns `CUT_SHORT`, then is marked unusable. Avoid: use `Math.max(1024, userMaxOutput)` capped at 4096; retry once at 4096 before declaring failure.
7. **Overrides lost on edits / base-URL change** — must preserve `overrides` while clearing only `tested`/`fromApi`/`detectedContext`/`noToolCalling`. Avoid: treat `overrides` as the only user-owned field; add regression test.
8. **Stale vision gating** — screenshot tool registered from a cached profile instead of the freshly resolved one. Avoid: build tool set inside `resolveModel` from `profile.vision === true`.
9. **CORS on custom cloud endpoints** — service worker `Origin: chrome-extension://…` blocked by gateways; no proxy escape hatch. Avoid: document origin allowance; surface status-0 errors distinctly.
10. **SDK parameter dialect mismatch** — some servers expect `max_completion_tokens` vs `max_tokens`; usage may come back null. Avoid: use chat-completions path; surface exact 400 body; degrade to estimation when usage is null.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Settings UI & validation
**Rationale:** Everything downstream (profile wiring, probes, agent gating) depends on the user being able to enter and correct limits, toggle providers, and supply a well-formed base URL. UI inputs and validation are the foundation; pitfalls 4, 9, 10 land here.
**Delivers:** Per-model `MAX_TOKENS`/`CONTEXT_WINDOW` inputs and vision toggle on `ModelChip`/`ProvidersSection`; detected-vs-user-set display; per-provider enable/disable toggle; base-URL trailing-slash normalization + http(s) scheme/host validation; CORS origin-allowance messaging; i18n keys in all three locales (English, Simplified Chinese, Traditional Chinese).
**Addresses:** Table-stakes features (per-model limits, vision override, provider toggle, base-URL normalization) and UX pitfalls (range validation, detected-value visibility, i18n).
**Avoids:** Pitfalls 4 (base-URL normalization), 9 (CORS messaging), 10 (overrides preserved on edits).

### Phase 2: Profile wiring & validation
**Rationale:** Once inputs exist, the resolver must honor them correctly and safely; local custom servers need concurrency limits. This is the core correctness phase; pitfalls 1, 2, 3 live here.
**Delivers:** `resolveProfile` clamps user override to server fact (`Math.min(override, fromApi)` when both present); `requestOutputLimit` makes the user's cap authoritative (floor `Math.min(profile.maxOutput, 1024)`); `maxConcurrent: 1` for any local endpoint via `isCloudEndpoint(kind, baseUrl)`; verification that `overrides` survive `withBaseUrl` and `saveTest` merges rather than replaces.
**Uses:** `src/llm/profiles.ts`, `src/extension/models.ts`, `src/store/settings.ts`.
**Implements:** Layered fact precedence (pattern 1), per-model overrides (pattern 2), no-tool-calling gate (pattern 4).
**Avoids:** Pitfalls 1 (inflated window), 2 (output cap exceeded), 3 (local concurrency), 10 (overrides lost).

### Phase 3: Test probe robustness
**Rationale:** Detection is best-effort and feeds gating; false positives/negatives here silently misconfigure models. Depends on Phase 2's wiring so probe caps can honor the user's `maxOutput`.
**Delivers:** Vision probe requires the answer to contain "red"; non-matching 200 → `vision = false`/unknown with manual override authoritative; tool probe uses `Math.max(1024, userMaxOutput)` capped at 4096 and retries once at 4096 on `CUT_SHORT` before marking `noToolCalling`; probe failures surface the server's exact 400 body; streaming/usage treated as optional (estimate when null).
**Uses:** `src/llm/connection.ts`, `src/llm/model-info.ts`.
**Implements:** Probe-driven detection with `ask` hints (pattern 3).
**Avoids:** Pitfalls 5 (vision false positive), 6 (tool-calling false negative), 7 (SDK parameter mismatch).

### Phase 4: Agent integration
**Rationale:** Final integration: screenshot tool gating must read the freshly resolved profile, and the run path must tolerate null usage and CORS-blocked endpoints. Depends on Phases 2–3 producing trustworthy `profile.vision` and limits.
**Delivers:** Tool set built inside `resolveModel` from `profile.vision === true` with a test flipping `overrides.vision`; usage-null degradation path in context management; documented origin requirement and distinct status-0 error surfacing in the UI; end-to-end run on a strict server.
**Uses:** `src/agent/loop.ts`, `src/agent/context.ts`, `src/extension/models.ts`.
**Implements:** Vision gating through the profile (pattern 5).
**Avoids:** Pitfalls 7 (parameter mismatch at run time), 8 (stale vision gating), 9 (CORS docs).

### Phase Ordering Rationale
- Phase 1 first: inputs and validation are prerequisites for everything else; without them, profile wiring has nothing to consume.
- Phase 2 second: correctness of limit resolution and concurrency must be in place before probes and runs depend on it.
- Phase 3 third: probe robustness depends on Phase 2's user-cap-aware output limit and feeds the `noToolCalling`/`vision` facts Phase 4 consumes.
- Phase 4 last: agent integration is the consumer of all prior phases; vision gating and usage degradation are verified end-to-end.
- Grouping keeps UI changes confined to `src/options/`, profile changes to `src/llm/` + `src/extension/`, and agent changes to `src/agent/`, respecting the import rules in `AGENTS.md`.

### Research Flags
Phases likely needing deeper research during planning:
- **Phase 3:** Vision probe heuristic (content check "red") and `CUT_SHORT` retry budget need validation against real reasoning models; sparse public docs on probe design for OpenAI-compatible endpoints.
- **Phase 4:** Strict-gateway CORS behavior and `max_tokens` vs `max_completion_tokens` dialect differences need manual testing against at least one strict gateway; no automated coverage exists.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Form inputs, range validation, i18n keys, URL parsing — well-established patterns.
- **Phase 2:** Precedence-chain edits and `Math.min` clamping are straightforward; unit-testable in `profiles.test.ts`.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against installed versions (`ai@7.0.150`, `@ai-sdk/openai@4.0.101`, `zod@4.6.7`) and official AI SDK docs; no new deps. |
| Features | HIGH | Grounded in Nanobrowser's existing code plus Open WebUI docs and ecosystem survey; table stakes consistent across products. |
| Architecture | HIGH | Directly mapped to existing modules and data flows in `src/store`, `src/llm`, `src/extension`, `src/options`. |
| Pitfalls | HIGH | Each pitfall cites concrete file:line locations and has a low-cost mitigation; several are directly reproducible. |

**Overall confidence:** HIGH

### Gaps to Address
- **Strict-gateway validation:** No automated or manual test against a CORS-strict cloud gateway yet; Phase 4 must include one. If none is available, document the limitation and rely on status-0 error surfacing.
- **Vision probe ground truth:** The "red" content check is a heuristic; a model that answers "red" by guessing without seeing the image would still pass. Consider a two-image challenge or manual override as the safety net (already supported via `overrides.vision`).
- **Probe output cap vs. user cap:** The exact interaction between `userMaxOutput` and the 4096 cap needs a unit test; `profiles.test.ts` should cover `CUT_SHORT` retry.
- **i18n coverage:** New field labels must be added to all three locale catalogues (`src/ui/locales`); a unit test should assert key parity.
- **Settings test coverage:** `settings.test.ts` may not exist yet; the overrides-survive-`withBaseUrl` regression test may need to be created.

## Sources

### Primary (HIGH confidence)
- Vercel AI SDK OpenAI provider docs (fetched 2026-10-30): https://ai-sdk.dev/providers/ai-sdk-providers/openai — `createOpenAI` settings, `.chat()` vs `.responses()`, `forceReasoning`.
- Vercel AI SDK OpenAI-compatible providers docs (fetched 2026-10-30): https://ai-sdk.dev/providers/openai-compatible-providers — capabilities of the separate `@ai-sdk/openai-compatible` package.
- Repository: `src/llm/providers.ts`, `src/llm/profiles.ts`, `src/llm/model-info.ts`, `src/llm/connection.ts`, `src/store/settings.ts`, `src/extension/models.ts`, `src/options/ProvidersSection.tsx`, `src/options/model-test.ts`, `wxt.config.ts`.
- `.planning/PROJECT.md` — milestone scope and constraints.
- `.planning/codebase/ARCHITECTURE.md` — overall extension architecture.
- `AGENTS.md` — fixed design constraints and import rules.

### Secondary (MEDIUM confidence)
- Open WebUI docs (retrieved 2026-10-30): OpenAI-compatible connections, `/models` verification failures, manual Model IDs, provider dropdown, enable/disable toggles, protocol-oriented design.
- Ecosystem knowledge: Lobe Chat, Chatbox, Cherry Studio, Continue.dev, LibreChat, AnythingLLM, Jan, LM Studio model configuration patterns.

### Tertiary (LOW confidence)
- None identified; all findings are grounded in codebase or official docs.

---
*Research completed: 2026-10-30*
*Ready for roadmap: yes*
