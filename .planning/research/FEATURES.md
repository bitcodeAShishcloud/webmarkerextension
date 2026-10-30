# Feature Research

**Domain:** Custom OpenAI-compatible model support in a browser-extension AI agent (Nanobrowser)
**Researched:** 2026-10-30
**Confidence:** HIGH (grounded in Nanobrowser's existing code + Open WebUI docs + ecosystem knowledge)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or unusable for custom models.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Custom base URL + API key per provider | The whole point of "custom"; every client has it | LOW | Exists: `ProviderConfig.baseUrl`, `keysStorage` |
| Add model IDs manually (typed entry) | Many endpoints don't publish `/models` (Anthropic-compat shims, Perplexity, MiniMax, GitHub Models) | LOW | Exists: `addModel`, datalist |
| Auto-list models from `/models` | Saves typing; expected on cloud endpoints | LOW-MED | Exists: `fetchModels`, `listModels` |
| Per-model context window + max output tokens | Different models on one endpoint differ wildly; agent loop needs them to avoid overflow/truncation | MEDIUM | **Gap**: `overrides` exists in data model but no UI; milestone closes this |
| Test connection / probe | Users need to know whether key+URL+model works before relying on it | MEDIUM | Exists: `testModel`, `testConnection`, `readModelInfo` |
| Mark models that cannot tool-call and exclude from agent use | Agent requires tool calling; a non-tool model must not be selectable | MEDIUM | Exists: `noToolCalling`, filtered in `choices` |
| Select a custom model as the default model | Otherwise custom models are unusable as the agent's model | LOW | Exists: `settings.defaultModel`, `usableModel` |
| Vision auto-detection gating the screenshot tool | Vision support varies; sending images to a non-vision model errors | MEDIUM | Partial: `overrides.vision` + probe; milestone wires it through |
| Masked API key display + clear/regenerate | Security baseline; keys never shown after save | LOW | Exists: `KeyField`, `KeyInput` |
| Clear error messages on bad key/URL/model | Users debug by message; generic failures cause abandonment | LOW | Exists: `listProblem`, `result.error`, origin-refused fix |
| Per-provider enable/disable toggle (without deleting) | Users switch between providers; preserving config matters | LOW | **Missing** in Nanobrowser; worth adding (Open WebUI has it) |
| Base URL normalization (trailing slash, `/v1` handling) | Users paste inconsistent URLs; failures look like broken providers | LOW | Partial: `openAICompatibleBaseUrl` handles ollama/lmstudio; custom endpoints use raw URL — add normalization |
| Concurrency hygiene for local servers | Local servers crash under parallel requests | LOW | `maxConcurrent` exists in `ModelSpec`; not user-facing — keep internal |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable. Nanobrowser is well-positioned on several.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Auto-detect context window / max output from `/models` or vendor API | Removes the most error-prone manual step; Open WebUI/Continue require manual entry | MEDIUM | Nanobrowser already does `readModelInfo` (Anthropic, Gemini, Ollama, LM Studio, OpenAI-compatible `/models`); custom OpenAI-compat returns facts when present |
| Auto-detect vision capability | Avoids wrong screenshot-tool gating | MEDIUM | `factsFrom` reads image modalities; probe fills gaps |
| Auto-detect reasoning support + None acceptance | Drives reasoning-effort UI and wire format correctly per model | MEDIUM-HIGH | `probeAsk` + `capabilityFrom`; already implemented |
| Auto-probe tool calling on add (not just on demand) | Catches incompatible models immediately instead of at first run | MEDIUM | Exists: `wholeTestOnAdd` for cloud endpoints |
| Per-model overrides that override detected values | Power users correct bad auto-detection; precedence chain already defined | LOW | `resolveProfile`: overrides → tested → fromApi → catalogue → defaults |
| Provider presets (xAI, DeepSeek, Mistral) as first-class choices | Reduces setup friction for popular endpoints | LOW | Exists: `PRESETS` |
| Local-server context lowering (detected window only ever lowers) | Prevents OOM on loaded (smaller) contexts | LOW | `detectedContext` + `Math.min` in `resolveProfile` |
| Model ID allowlist filtering for huge catalogues (OpenRouter) | OpenRouter returns thousands; unfiltered lists are unusable | LOW-MED | Partial: `showAll`/hidden split exists; could add search/filter |
| Origin-refused fix guidance (CORS) for local servers | Local servers refuse browser origin by default; clear fix instructions reduce support load | LOW | Exists: `OriginFix` |
| Cost tracking where provider reports it (OpenRouter) | Users want to know spend | MEDIUM | Exists: `usageAccounting` |
| Capability badges on model chips (reasons / no reasoning) | Transparency about what the model can do | LOW | Exists: tooltip in `ModelChip` |
| Manual override of auto-detected values (vision, context, max output) | Auto-detection is best-effort; user must be able to correct | LOW | **Gap**: needs UI inputs; milestone should add them (overrides already plumbed) |
| Re-test on base URL change | Catches stale detection when endpoint changes | LOW | Exists: blur handler re-runs tests |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Fully generic (non-OpenAI-compatible) provider adapters | "Support every provider" | Each adapter is a maintenance burden; Vercel AI SDK already covers OpenAI-compatible endpoints | Reuse `openai-compatible` kind (decided) |
| Per-model API keys | "Different keys per model" | Complicates storage and UI; provider key is shared by all its models today | Keep one key per provider (decided) |
| New `ProviderKind` variants | "Cleaner typing" | Breaks catalogue/profile/switch logic; not needed | Reuse `openai-compatible` (decided) |
| Azure OpenAI support | "Enterprise customers" | Different auth/URL shape; deferred | Out of scope (decided) |
| Local model download/load/unload management (server-side) | "Manage models in-app" | Nanobrowser is a client; managing weights is the server's job (Open WebUI does this for llama.cpp/LM Studio) | Point users to their server's UI; only chat via the endpoint |
| Storing model weights / running inference in-extension | "Offline use" | Impossible in MV3; wrong layer | Out of scope |
| Cloud sync of providers/keys | "Sync across devices" | Keys must never leave the browser; sync risks leakage | Keep in `chrome.storage.local` only |
| Export/import of API keys | "Backup convenience" | Security risk; keys are secrets | Never export keys (AGENTS.md) |
| Provider-specific proprietary APIs in core (protocol-oriented) | "Native features" | Couples client to vendor quirks; Open WebUI explicitly avoids this | Follow OpenAI Chat Completions protocol only; use overrides for limits |
| Auto-fetch models on every keystroke / blur of base URL | "Always fresh" | Wastes requests; some endpoints rate-limit `/models` | Fetch on explicit "Fetch models" / key save / blur of changed URL only (current behavior) |
| Text tool-call parser for models without native tool calling | "Support more models" | Explicitly deferred; agent requires native tool calls | Mark `noToolCalling` and exclude (current behavior) |
| Multiple cooperating agents / planner-navigator | "Better results" | Out of scope for first release | Single agent loop |
| MCP bridge to drive layer/agent | "External automation" | Out of scope | Layer stays in-extension only |
| Per-model pricing/cost dashboards | "Track spend" | Beyond scope; only OpenRouter cost is tracked | Keep minimal usage accounting |
| Custom HTTP headers / auth schemes beyond Bearer | "Enterprise SSO" | Adds complexity; OpenAI-compatible standard is Bearer | Standard Bearer only; revisit if a major provider needs it |
| Manual "context window" as a hard cap that silently truncates | "Safety" | Silent truncation violates "degrade loudly"; better to surface and let compaction handle | Surface limits in profile; compaction respects them (existing) |

## Feature Dependencies

```
Custom base URL + key (provider config)
  → /models listing (fetchModels) [optional; manual entry fallback]
  → Add model IDs (manual or from list)
  → Test models probe (readModelInfo + testConnection)
       → tool-calling detection → noToolCalling flag → selectable as default
       → vision detection → overrides.vision / tested.vision → screenshot tool gating
       → context window / max output detection → tested/fromApi → profile
  → Per-model overrides UI (MAX_TOKENS, CONTEXT_WINDOW, vision) → overrides → resolveProfile
  → Selectable default model (usableModel filters noToolCalling)

Profile resolution (overrides → tested → fromApi → catalogue → defaults)
  → requestOutputLimit (caps maxOutput vs contextWindow/4)
  → context compaction threshold (contextWindow)
  → screenshot tool gating (vision)

Base URL change
  → withBaseUrl clears detectedContext, noToolCalling, tested (keeps overrides)
  → re-run tests
```

### Dependency Notes

- **Overrides are the user-facing knob; detection is best-effort.** The probe must never overwrite a user-set override (precedence already guarantees this in `resolveProfile`).
- **`withBaseUrl` already preserves `overrides`** while clearing detected/tested facts — this is the correct behavior and must be kept when adding UI inputs (don't accidentally clear overrides on URL edit).
- **Tool-calling gate is strict**: a model with `noToolCalling` cannot be selected as default (`choices` filters, `usableModel` skips). Vision gating must follow the same pattern.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate custom model support.

- [ ] Expose per-model MAX_TOKENS (max output) and CONTEXT_WINDOW inputs in Settings → Providers (table stakes; headline gap). Low-Med complexity. Wire to `overrides.maxOutput`/`overrides.contextWindow`.
- [ ] Expose a vision toggle/override per model (table stakes for correct screenshot gating). Low complexity; reuse `overrides.vision`.
- [ ] Show detected vs. user-set values (differentiator; helps users trust auto-detection). Low complexity.
- [ ] Per-provider enable/disable toggle (table stakes parity with Open WebUI). Low complexity.
- [ ] Base URL normalization for custom endpoints (table stakes robustness). Low complexity.

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Model ID search/filter for large catalogues (differentiator; defer unless OpenRouter usage demands it). Low-Med complexity.
- [ ] Manual override editing affordances (inline edit of detected values). Low complexity.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Model management for local servers (load/unload) — wrong layer; server's responsibility.
- [ ] Custom HTTP headers / auth schemes — revisit on demand.
- [ ] Cost dashboards — out of scope.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Per-model MAX_TOKENS + CONTEXT_WINDOW inputs | HIGH | MEDIUM | P1 |
| Vision override per model | HIGH | LOW | P1 |
| Detected vs. user-set display | MEDIUM | LOW | P1 |
| Per-provider enable/disable toggle | MEDIUM | LOW | P1 |
| Base URL normalization | MEDIUM | LOW | P1 |
| Model ID search/filter (large catalogues) | MEDIUM | LOW-MED | P2 |
| Manual override editing affordances | MEDIUM | LOW | P2 |
| Local server model management | LOW | HIGH | P3 |
| Custom headers/auth | LOW | MEDIUM | P3 |
| Cost dashboards | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Open WebUI | Continue.dev / Lobe Chat | Nanobrowser (current) | Our Plan |
|---------|------------|--------------------------|----------------------|----------|
| Custom base URL + key | Yes | Yes | Yes | Keep |
| Manual model ID entry | Yes (Model IDs allowlist) | Yes | Yes | Keep |
| Auto-list `/models` | Yes | Yes | Yes | Keep |
| Per-model context/max output | Manual entry (some providers) | Manual entry | Data model only, no UI | Add UI (P1) |
| Test connection | Verify Connection button | Varies | Test models probe | Keep, surface results |
| Tool-calling detection | Not stated | Varies | Yes (`noToolCalling`) | Keep |
| Vision detection | Manual | Manual | Auto (probe) | Wire through (P1) |
| Reasoning detection | Not stated | Varies | Auto (probe) | Keep |
| Provider enable/disable toggle | Yes | Varies | No | Add (P1) |
| Local server model mgmt | Yes (llama.cpp/LM Studio) | No | No | Defer (P3) |
| Cost tracking | No | Varies | OpenRouter only | Keep minimal |

## Sources

- Nanobrowser codebase: `src/store/settings.ts` (`ModelEntry`, `ProfileOverrides`, `withBaseUrl`, `learnFacts`), `src/llm/profiles.ts` (`resolveProfile`, `probeAsk`), `src/llm/model-info.ts` (`factsFrom`, `readModelInfo`), `src/options/ProvidersSection.tsx`, `src/options/model-test.ts`
- Nanobrowser `PROJECT.md` Active/Out of Scope sections
- Open WebUI docs: OpenAI-compatible connections, `/models` verification failures, manual Model IDs, Provider dropdown, enable/disable toggles, protocol-oriented design (retrieved 2026-10-30)
- Ecosystem knowledge: Lobe Chat, Chatbox, Cherry Studio, Continue.dev, LibreChat, AnythingLLM, Jan, LM Studio model configuration patterns (HIGH confidence for common features; MEDIUM for niche ones)

Confidence notes:
- Table stakes list: HIGH — consistent across all surveyed products.
- Differentiators: MEDIUM-HIGH — Nanobrowser already implements most; the "manual override UI" gap is the main new surface.
- Anti-features: HIGH — directly supported by PROJECT.md Out of Scope and AGENTS.md constraints.

---
*Feature research for: custom OpenAI-compatible model support in Nanobrowser*
*Researched: 2026-10-30*