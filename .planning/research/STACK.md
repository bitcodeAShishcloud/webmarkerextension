# Technology Stack

**Project:** WebMarker Extensions (custom OpenAI-compatible model support)
**Researched:** 2026-10-30
**Confidence:** HIGH (verified against installed versions and official AI SDK docs)

## Recommended Stack

No new dependencies are required. Custom OpenAI-compatible models reuse the
existing Vercel AI SDK OpenAI provider and the extension's existing storage,
profile and probe machinery. The work is wiring (UI + overrides), not new
infrastructure.

### Core LLM provider

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `ai` (Vercel AI SDK core) | 7.0.150 (pinned) | `generateText`/`streamText`, tool calling, `maxOutputTokens`, provider options | Already the agent's runtime; tool calls and streaming are proven on it. No alternative needed. |
| `@ai-sdk/openai` | 4.0.101 (pinned) | `createOpenAI({ baseURL, apiKey })` plus `.chat(modelId)` for chat completions | Speaks the OpenAI Chat Completions API that every "OpenAI-compatible" endpoint implements. The `.chat()` factory selects chat completions explicitly, avoiding the Responses API, which third-party endpoints do not implement. |
| `zod` | 4.6.7 (pinned) | Tool parameter schemas and validation of user-entered limits | Already used for every tool; reuse for validating base URLs and numeric limits in the UI. |

### Browser extension runtime / storage

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Chrome MV3 service worker + `chrome.storage.local` | Chrome 125+ (manifest minimum) | Keys under `nb.keys`, providers under `nb.providers`, settings under `nb.settings` | Already the storage layer; keys never leave the browser. `host_permissions: ['<all_urls>']` already grants fetch to arbitrary user base URLs, so CORS is not a blocker for custom endpoints. |
| `idb` | ^8.0.4 | IndexedDB for conversations/attachments | Unchanged; limits are stored on the provider/model entry, not in IDB. |

### Profile / limit resolution (already present)

| Component | File | Role |
|-----------|------|------|
| `ModelEntry.overrides` | `src/store/settings.ts` | Carries per-model `contextWindow`, `maxOutput`, `vision`. Already feeds `resolveProfile`. |
| `resolveProfile` | `src/llm/profiles.ts` | Precedence: overrides → tested → fromApi → catalogue row → endpoint defaults. Already consumes overrides. |
| `requestOutputLimit` | `src/llm/profiles.ts` | Caps the per-request `maxOutputTokens` sent to the SDK. Already uses `profile.maxOutput`. |
| `readModelInfo` | `src/llm/model-info.ts` | Reads `/models` for OpenAI-compatible endpoints and extracts `context_length`/`max_tokens`/vision via `factsFrom`. Already works for custom endpoints. |
| `testConnection` | `src/llm/connection.ts` | Probes tool calling, reasoning and (when asked) vision. Already consumes `ProbeAsk`. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| OpenAI-compatible adapter | `@ai-sdk/openai` + `.chat()` | `@ai-sdk/openai-compatible` (`createOpenAICompatible`) | The latter is the newer, dedicated package and supports `supportsMultiPartToolContent`, `includeUsage`, `transformRequestBody`. But the project's constraint is "no new dependencies", and `@ai-sdk/openai` already covers chat completions at an arbitrary base URL. Adding the package would also split the code path (two adapters for one kind). Defer until a milestone explicitly allows new deps. |
| API selection | `.chat(modelId)` (chat completions) | `.responses(modelId)` (Responses API) | The Responses API is OpenAI-only. Third-party endpoints (DeepSeek, Mistral, vLLM, Ollama, LM Studio, custom) reject `/responses`. The SDK docs state: "If your custom base URL only supports the Chat Completions API, create chat models with `openai.chat('model-id')` instead." The codebase already uses `.chat()` in the default branch. |
| API selection | `.chat(modelId)` | `.completion(modelId)` (legacy completions) | Legacy completions lack tool calling. The agent requires tool calls, so chat completions is mandatory. |
| Limit storage | Per-model `overrides` on `ModelEntry` | Provider-level limits | Different models on one endpoint (e.g. a 70B and an 8B on the same vLLM) have different windows. Per-model overrides are the established design and already feed `resolveProfile`. |
| Key storage | `chrome.storage.local` (`nb.keys`) | IndexedDB / in-memory | Keys must persist across service-worker restarts and must not be bundled into conversations (export/backup). `chrome.storage.local` is the existing, audited store. |
| Vision gating | Auto-detect via image probe + `overrides.vision` | Manual-only toggle | The requirement is auto-detect with manual override through overrides. The probe (`testConnection` image probe) and `probeAsk` already implement the detection half; only the UI toggle is missing. |

## What NOT to use

- **Do not add `@ai-sdk/openai-compatible`** as a dependency. It duplicates `@ai-sdk/openai`'s chat-completions path and conflicts with the "no new dependencies" constraint. The existing `createOpenAI` + `.chat()` path already handles arbitrary base URLs, API keys, and headers.
- **Do not use the Responses API (`.responses()` / default `openai(modelId)`) for custom endpoints.** It will fail on any non-OpenAI server. Keep `.chat()` for the `openai-compatible` kind.
- **Do not store limits on the provider instead of the model.** Per-model overrides are required because one endpoint can serve models with different windows.
- **Do not read keys from storage inside `src/llm`.** `src/llm` is browser-agnostic and receives the key via `ModelSpec.apiKey`. Keep the boundary.
- **Do not bypass the probe for tool calling.** A model that cannot emit tool calls cannot run the agent; the `noToolCalling` mark and the picker's filter (`usableModel`) already enforce this. Do not relax it for custom models.
- **Do not treat `maxOutputTokens` as the context window.** They are independent inputs: `maxOutput` (max output) feeds `requestOutputLimit` and the request's `maxOutputTokens`; `contextWindow` feeds compaction and the `detectedContext` clamp. Conflating them breaks compaction and truncates replies.
- **Do not rely on the SDK to know a custom model's window.** The SDK has no catalogue for unknown model ids; limits come from `overrides` (user) or `readModelInfo` (API). Always run Test models before allowing selection as default.
- **Do not send `reasoning_effort` to endpoints that reject it without the fallback.** The stream layer already handles refusal (`refusesReasoning`); keep that path for custom endpoints.

## Installation

No changes. The required packages are already dependencies:

```bash
# Already installed — no action needed
# ai@7.0.150
# @ai-sdk/openai@4.0.101
# zod@4.6.7
```

## Sources

- Vercel AI SDK OpenAI provider docs (fetched 2026-10-30): https://ai-sdk.dev/providers/ai-sdk-providers/openai — `createOpenAI` settings (`baseURL`, `apiKey`, `name`, `fetch`), `.chat()` vs `.responses()`, `forceReasoning` for stealth reasoning models via custom base URL.
- Vercel AI SDK OpenAI-compatible providers docs (fetched 2026-10-30): https://ai-sdk.dev/providers/openai-compatible-providers — `createOpenAICompatible` capabilities (`includeUsage`, `supportsMultiPartToolContent`, `transformRequestBody`); confirms it is a separate package, not needed here.
- Repository: `src/llm/providers.ts`, `src/llm/profiles.ts`, `src/llm/model-info.ts`, `src/llm/connection.ts`, `src/store/settings.ts`, `wxt.config.ts` (host_permissions `<all_urls>`).