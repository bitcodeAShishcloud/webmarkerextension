# Pitfalls Research

**Domain:** OpenAI-compatible custom model support in a Chrome MV3 AI web-automation agent (Nanobrowser)
**Researched:** 2026-10-30
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: User-entered limits silently override safer server-reported values

**What goes wrong:**
A user types `CONTEXT_WINDOW = 200000` for a model whose endpoint actually reports `context_length = 32768`. `resolveProfile` takes `overrides.contextWindow` first (`profiles.ts:93`: `overrides?.contextWindow || tested?.contextWindow || fromApi?.contextWindow || base.contextWindow`), so the inflated value wins. Compaction never triggers, requests exceed the real window, and the server returns context-overflow errors mid-run. Worse, `isSilentOverflow` never fires because the configured window is larger than reality.

**Why it happens:**
The precedence chain puts user overrides above `fromApi`, which is correct for "respect what the user states" but assumes the user is right. `readModelInfo` already reads `context_length`/`max_context_length` for OpenAI-compatible endpoints (`model-info.ts:34-40`), so a safer value is available and discarded.

**How to avoid:**
When both an override and a `fromApi` value exist, take `Math.min(override, fromApi)` rather than the override alone. Validate entered values against a sane range (e.g. 1k–2M for context, 256–128k for max output) and reject or clamp out-of-range input in the UI. Keep the override as a ceiling, never a floor, on top of server facts.

**Warning signs:**
Context-overflow errors from a model that "passed" Test models; compaction summaries rarely or never appear; `usage.input` exceeds the real window in run records.

**Phase to address:**
Phase 2: Profile wiring & validation.

---

### Pitfall 2: `requestOutputLimit` can exceed the user's `MAX_TOKENS`

**What goes wrong:**
`requestOutputLimit` (`profiles.ts:130`) is `Math.max(1024, Math.min(profile.maxOutput, 16_384, Math.floor(profile.contextWindow / 4)))`. If a user sets `maxOutput = 512`, the `Math.max(1024, …)` floor raises the sent cap to 1024, violating "the output limits the user states are respected" and risking 400s on endpoints that enforce the cap strictly.

**Why it happens:**
The floor was added so a reply on a tiny window is not truncated to nothing, but it is applied after the user's value, so a deliberately small cap is ignored.

**How to avoid:**
Make the user's cap authoritative: `Math.min(profile.maxOutput, 16_384, Math.floor(profile.contextWindow / 4))`, with a floor of `Math.min(profile.maxOutput, 1024)` (never above the user's value). Add a unit test in `profiles.test.ts` asserting a 512 override yields ≤ 512.

**Warning signs:**
Run requests send more output tokens than the Settings field shows; endpoints return "max_tokens exceeds limit" 400s.

**Phase to address:**
Phase 2: Profile wiring & validation.

---

### Pitfall 3: Local custom endpoints get no concurrency limit

**What goes wrong:**
`resolveModel` (`extension/models.ts:85`) sets `maxConcurrent: 1` only for `LOCAL_KINDS` (`ollama`, `lmstudio`). A user pointing an `openai-compatible` provider at `http://localhost:8000/v1` (vLLM, llama.cpp, TGI) gets unlimited concurrency, so parallel tool batches overwhelm the server (503/timeout) and the agent's slot limiter never engages.

**Why it happens:**
"Local" is decided by `kind`, not by host. `isCloudEndpoint` already classifies a localhost `openai-compatible` URL as local for catalogue defaults, but the concurrency branch does not consult it.

**How to avoid:**
Key `maxConcurrent` off `isCloudEndpoint(kind, baseUrl)` (or a shared `isLocal` helper): `maxConcurrent: 1` for any local endpoint. Keep the slot key `${kind} ${baseUrl}` so different local servers do not share a slot.

**Warning signs:**
503/timeout bursts on a local GPU server when the agent issues parallel tool calls; Chrome network panel shows many simultaneous requests to the same origin.

**Phase to address:**
Phase 2: Profile wiring & validation.

---

### Pitfall 4: Base-URL normalization is inconsistent and undocumented

**What goes wrong:**
`openAICompatibleBaseUrl` adds `/v1` only for `ollama`/`lmstudio` (`providers.ts:65`). For `openai-compatible`, the URL is used verbatim. Users type `https://api.example.com` (expecting `/v1` appended, like Ollama) or `https://api.example.com/v1/` (trailing slash). The former 404s on `/chat/completions`; the latter double-slashes or fails depending on the SDK's path joining. Presets (xAI, DeepSeek, Mistral) all carry `/v1`, which teaches the wrong convention inconsistently.

**Why it happens:**
There is no single documented contract for what the field means, and the SDK's `baseURL` is joined differently than users assume.

**How to avoid:**
Define and document one contract: the field is the full base URL including `/v1` (OpenAI style), and normalize by trimming trailing slashes only. Show a placeholder of `https://api.example.com/v1` and reject/trim trailing slashes in the UI. Do not silently append `/v1` for `openai-compatible` (it breaks endpoints that mount at root), but do validate the URL parses and uses http/https.

**Warning signs:**
404 on `/chat/completions` or "Could not reach host" right after saving a base URL; users paste a host root and get instant failures.

**Phase to address:**
Phase 1: Settings UI & validation.

---

### Pitfall 5: Vision auto-detection marks a model "vision" on absence of error only

**What goes wrong:**
The image probe (`connection.ts:117-133`) sets `tested.vision = true` whenever the request succeeds, even if the model answered "red" by guessing without actually receiving the image, or returned a refusal that did not match `/image|vision|multimodal/i`. The screenshot tool then gets enabled for a model that cannot see, so the agent sends images that are silently ignored or hallucinated over.

**Why it happens:**
`refusesImages` is a string heuristic on the error message; a 200 with a wrong answer is treated as success. Many weak endpoints return 200 and describe the image generically.

**How to avoid:**
Tighten the probe: require the answer to contain the expected color ("red") for a pass, and treat a 200 whose text does not mention the color as `vision = false` (or "unknown", leaving the manual override). Keep the manual `overrides.vision` authoritative when set, and re-run the probe when it is cleared. Surface the detected value in the UI so users can correct it.

**Warning signs:**
Screenshot tool enabled but the agent's answers about page content are generic/wrong; image probes return 200 with irrelevant text.

**Phase to address:**
Phase 3: Test probe robustness.

---

### Pitfall 6: Tool-calling probe false negatives from reasoning eating the budget

**What goes wrong:**
The tool probe sends `maxOutputTokens: 1024` (`connection.ts:68`), which is fine, but some reasoning models spend the whole budget thinking and return `finish: 'length'` with no tool call. The code already returns `CUT_SHORT` in that case (`connection.ts:88`), but a user re-testing after raising `MAX_TOKENS` still hits the same 1024 probe cap, so a model that would tool-call with more room is marked `noToolCalling` and becomes unselectable.

**Why it happens:**
The probe's output cap is fixed and ignores the user's `maxOutput` override; the "cut short" path is treated as a definitive failure rather than "retry with more room".

**How to avoid:**
Let the whole probe use `Math.max(1024, userMaxOutput)` capped at 4096, and on `CUT_SHORT` retry once with 4096 before declaring failure. Store `noToolCalling` only after the retry. Also keep the per-model `MAX_TOKENS` field out of the probe's tool-decision path so a low user cap does not disable a model.

**Warning signs:**
A model that works in other clients is marked "no tool calling"; Test models reports `CUT_SHORT` repeatedly; the notice appears only on reasoning models.

**Phase to address:**
Phase 3: Test probe robustness.

---

### Pitfall 7: OpenAI SDK parameter names mismatch custom servers

**What goes wrong:**
The SDK maps `maxOutputTokens` to `max_tokens` for chat completions, but some OpenAI-compatible servers (newer vLLM, some proxies) expect `max_completion_tokens` and reject `max_tokens` (or vice versa), returning 400 on every run. Similarly, `stream_options.include_usage` may not be honored, so usage comes back null and context compaction falls back to 4-chars-per-token estimation.

**Why it happens:**
The Vercel AI SDK targets OpenAI's schema; "OpenAI-compatible" servers vary in which fields they accept, and there is no negotiation.

**How to avoid:**
Keep `strictJsonSchema: false` (already set, `providers.ts:118`) and do not send extra fields. Make the probe's failure message surface the server's exact 400 body so users can see which field was rejected. Optionally allow a "non-streaming" or "no usage" degradation path in context management when usage is null (already needed for some endpoints). Document the supported dialect: chat completions with `max_tokens`, `stream`, and tool calls.

**Warning signs:**
Every request 400s with "unknown field max_tokens"/"max_completion_tokens"; run records show `usage: null` for all turns.

**Phase to address:**
Phase 3: Test probe robustness + Phase 4: Agent integration.

---

### Pitfall 8: Vision gating the screenshot tool is computed from a stale profile

**What goes wrong:**
The screenshot tool is registered based on the model's profile, but if the registration happens once at extension startup or from a cached profile, a model whose `overrides.vision` was changed (or auto-detected later) keeps the old gating. The agent either never sends screenshots to a vision model or sends them to a non-vision one.

**Why it happens:**
Tool sets are built per run in some places and per session in others; the vision flag must come from the same `resolveProfile` call that produces the chat client.

**How to avoid:**
Build the tool set inside `resolveModel`/the run setup using the freshly resolved `profile.vision`, never a cached boolean. Gate with `profile.vision === true` (not truthy). Add a test that flips `overrides.vision` and verifies the screenshot tool appears/disappears on the next run.

**Warning signs:**
Screenshot tool present for a text-only model (400 on image) or absent for a VLM (agent describes pages from text only).

**Phase to address:**
Phase 4: Agent integration.

---

### Pitfall 9: CORS / browser-origin restrictions on custom cloud endpoints

**What goes wrong:**
The extension's service worker issues requests with an `Origin: chrome-extension://…` header. Many OpenAI-compatible gateways (and some first-party endpoints) do not allow that origin, so the browser blocks the request before it reaches the server and the UI shows a network error. Local servers need `OLLAMA_ORIGINS` (already handled) but cloud custom endpoints have no equivalent.

**Why it happens:**
There is no backend proxy in this architecture (per AGENTS.md, the layer is in-extension only), so CORS is enforced by the browser with no escape hatch.

**How to avoid:**
Document that the endpoint must allow the extension origin (or `*`), and surface CORS failures distinctly from auth failures in `listProblem`/connection errors. Do not attempt to add a proxy or disable CORS. Test against at least one strict gateway during the milestone.

**Warning signs:**
Requests fail with status 0 / "Failed to fetch" while curl to the same URL works; no HTTP status in the error.

**Phase to address:**
Phase 4: Agent integration (docs) + Phase 1 (UI messaging).

---

### Pitfall 10: Per-model overrides are lost or duplicated on provider edits

**What goes wrong:**
`withBaseUrl` (`settings.ts:127`) preserves `overrides` but drops `tested`/`fromApi`/`detectedContext`/`noToolCalling` when the base URL changes — correct for server facts. But `addModel` (`ProvidersSection.tsx:341`) creates `{ name: trimmed }` with no overrides, and there is no edit path to change overrides after creation except a full re-test. If the UI for `MAX_TOKENS`/`CONTEXT_WINDOW` binds directly to the entry, a base-URL change wipes the user's carefully entered numbers only if the code mistakenly includes them in the cleared set; conversely, a careless implementation keeps stale server facts across a server change.

**Why it happens:**
The split between "user facts" (overrides) and "server facts" (tested/fromApi/detected) is implicit; UI code tends to spread the whole entry.

**How to avoid:**
Treat `overrides` as the only user-owned field: preserve it across base-URL changes (already done) and across model rename/re-add. Clear only `tested`, `fromApi`, `detectedContext`, `noToolCalling` on server change. Add a regression test in `settings.test.ts` (if added) asserting overrides survive `withBaseUrl`.

**Warning signs:**
User-set limits reset to catalogue defaults after editing the base URL; or server-reported facts persist after pointing at a different server.

**Phase to address:**
Phase 1: Settings UI & persistence.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Trust user-entered context window verbatim | Simple UI, no validation | Silent overflow, bad compaction, user blame | Never — always clamp to server fact when present |
| Fixed 1024 probe output cap | Fast, predictable tests | False "no tool calling" on reasoning models | Never for the final milestone |
| Keep `maxConcurrent` keyed to `kind` only | Less branching | Local custom servers overwhelmed | Only for the built-in local kinds; fix for openai-compatible |
| Skip vision answer-content check | Simpler probe | Screenshot tool mis-gated | Never |
| Hardcode English labels for new fields | Faster shipping | Breaks the 3-language contract (AGENTS.md) | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenAI-compatible endpoint | Sending `max_completion_tokens` to a server expecting `max_tokens` (or vice versa) | Use SDK chat-completions path; surface the server's exact 400 in the UI |
| OpenAI-compatible endpoint | Assuming streaming + usage reporting | Probe streaming first; treat null usage as "estimate" in compaction |
| Local server (vLLM/llama.cpp) | Treating it as cloud (unlimited concurrency) | Classify by host via `isCloudEndpoint`; set `maxConcurrent: 1` locally |
| Custom cloud gateway | Ignoring CORS preflight | Document origin allowance; surface status-0 errors distinctly |
| Model listing (`/models`) | Hiding everything that lacks `supported_parameters: tools` | Some compatible servers omit that field; fall back to name/NOT_CHAT heuristics |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Inflated context window from user input | No compaction, overflow 400s | Clamp to server fact; validate range | First long conversation on an over-stated model |
| Unlimited concurrency on a local GPU box | 503 bursts, slow runs | `maxConcurrent: 1` for local endpoints | First parallel tool batch |
| Probe re-running on every keystroke | UI lag, wasted tokens | Debounce; test only on blur/add | Providers with many models |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Accepting non-http(s) base URLs | SSRF / key exfiltration to arbitrary schemes | Validate URL scheme and host in the UI and storage merge |
| Logging API keys or full request URLs | Key leakage in console/storage exports | Audit that `spec.apiKey` never reaches `console` or error messages |
| Trusting model output as instructions | Prompt injection via page content | Keep page content inside the boundary (AGENTS.md) — unchanged by this milestone |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No range validation on MAX_TOKENS/CONTEXT_WINDOW | Silent overflow or 400s | Inline validation with min/max and helper text |
| Hiding detected vision/tool-calling results | User cannot correct auto-detect | Show detected values with an override affordance |
| Marking a model "no tool calling" permanently | User cannot use a model that would work | Allow re-test; clear the flag on a successful test |
| English-only labels for new fields | Breaks i18n contract | Add keys to all three locale catalogues |

## "Looks Done But Isn't" Checklist

- [ ] **Per-model limits UI:** Often missing validation and min/max — verify out-of-range input is rejected and clamped.
- [ ] **Overrides wiring:** Often missing `overrides` in `capabilityOf`/some `resolveProfile` call sites — verify `extension/models.ts` and `settings.ts:210` pass `overrides`.
- [ ] **Vision gating:** Often missing the screenshot tool's dependence on `profile.vision` — verify a flip of the override changes tool availability.
- [ ] **Concurrency:** Often missing local classification for openai-compatible — verify a localhost endpoint gets `maxConcurrent: 1`.
- [ ] **Base URL contract:** Often missing trailing-slash normalization and scheme validation — verify both.
- [ ] **Probe robustness:** Often missing the CUT_SHORT retry — verify a reasoning model is not falsely marked unusable.
- [ ] **i18n:** Often missing three-language coverage — verify new keys exist in `src/ui/locales`.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Inflated context window | LOW | Re-test model; override is cleared/ corrected; compaction resumes |
| False "no tool calling" | LOW | Re-run Test models; flag cleared on success |
| Mis-gated vision | LOW | Toggle override or re-test; tool set rebuilds next run |
| Lost overrides after base-URL change | MEDIUM | Re-enter values; add regression test to prevent recurrence |
| CORS-blocked endpoint | HIGH | User must change endpoint or allow origin; no in-app fix |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Inflated context window | Phase 2: Profile wiring & validation | Unit test: override > fromApi → min used; integration run no overflow |
| 2. requestOutputLimit exceeds cap | Phase 2: Profile wiring & validation | Unit test: 512 override → ≤ 512 sent |
| 3. No concurrency limit locally | Phase 2: Profile wiring & validation | Test: localhost endpoint → maxConcurrent 1 |
| 4. Base-URL normalization | Phase 1: Settings UI & validation | Manual: trailing slash trimmed, root URL documented |
| 5. Vision false positive | Phase 3: Test probe robustness | Probe on a text-only model returns vision=false |
| 6. Tool-calling false negative | Phase 3: Test probe robustness | Reasoning model not marked unusable after retry |
| 7. SDK parameter mismatch | Phase 3 + Phase 4 | Probe surfaces exact 400; run completes on a strict server |
| 8. Stale vision gating | Phase 4: Agent integration | Override flip changes screenshot tool presence |
| 9. CORS on custom cloud | Phase 1 + Phase 4 | Documented origin requirement; distinct error in UI |
| 10. Overrides lost on edit | Phase 1: Settings UI & persistence | Test: overrides survive `withBaseUrl` |

## Sources

- Codebase: `src/llm/profiles.ts`, `src/llm/connection.ts`, `src/llm/model-info.ts`, `src/llm/providers.ts`, `src/store/settings.ts`, `src/extension/models.ts`, `src/options/model-test.ts`, `src/options/ProvidersSection.tsx`
- OpenAI function-calling guide (fetched 2026-10-30): strict mode, `additionalProperties`, `max_tokens` vs `max_completion_tokens`, streaming usage
- Project constraints: `AGENTS.md`, `.planning/PROJECT.md`

---
*Pitfalls research for: OpenAI-compatible custom model support*
*Researched: 2026-10-30*