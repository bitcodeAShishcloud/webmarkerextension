# Architecture Patterns

**Domain:** Custom OpenAI-compatible model support in a Chrome/Edge MV3 AI web-automation extension (WebMarker Extensions)
**Researched:** 2026-10-30
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Settings UI (src/options)                                            │
│  ProvidersSection · Welcome model setup · ModelChip per model         │
└──────────────┬───────────────────────────────────────────────────────┘
               │ chrome.storage.local (nb.providers, nb.keys)
┌──────────────▼───────────────────────────────────────────────────────┐
│ Store (src/store/settings.ts)                                         │
│  ProviderConfig[] · ModelEntry.overrides · keys by provider id        │
└──────────────┬───────────────────────────────────────────────────────┘
               │ read at run time / test time
┌──────────────▼───────────────────────────────────────────────────────┐
│ LLM layer (src/llm)                                                   │
│  readModelInfo · testConnection · probeAsk · resolveProfile           │
│  createModel (OpenAI-compatible client) · isCloudEndpoint             │
└──────────────┬───────────────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────────────┐
│ Extension model resolver (src/extension/models.ts)                    │
│  usableModel · findModel · detectContext (ollama/lmstudio only)       │
│  resolveProfile(overrides, learned, catalogue) · createModel          │
└──────────────┬───────────────────────────────────────────────────────┘
               │ ResolvedModel { chat, profile, reasoning, learn }
┌──────────────▼───────────────────────────────────────────────────────┐
│ Agent loop (src/agent)                                                │
│  stream turn · tool dispatch · context compaction · vision gating     │
└───────────────────────────────────────────────────────────────────────┘
```

Supporting flow, used only by Settings and Welcome:

```text
Settings UI → listModels (provider API) → add ModelEntry
Settings UI → testModel → readModelInfo + testConnection → saveTest
                 (fromApi, tested, noToolCalling, detectedContext)
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Provider store | Source of truth for providers, model ids, overrides, learned facts, and keys | `src/store/settings.ts` (`providersStorage`, `keysStorage`, `ProviderConfig`, `ModelEntry`, `ProfileOverrides`) |
| Profile resolver | Combines overrides, learned facts, catalogue rows, and endpoint defaults into one `ModelProfile` | `src/llm/profiles.ts` (`resolveProfile`, `requestOutputLimit`, `probeAsk`) |
| Provider factory | Builds the Vercel AI SDK client for an OpenAI-compatible endpoint | `src/llm/providers.ts` (`createModel`, `openAICompatibleBaseUrl`) |
| Model API reader | Reads limits, vision, and reasoning facts from a provider's `/models` record | `src/llm/model-info.ts` (`readModelInfo`, `factsFrom`) |
| Connection tester | Probes tool calling, reasoning, None acceptance, and vision | `src/llm/connection.ts` (`testConnection`, `listModels`) |
| Extension resolver | Bridges storage to the LLM layer at run time; detects local context for Ollama/LM Studio | `src/extension/models.ts` (`livePair`, `resolveModel`) |
| Settings UI | Adds providers/models, edits base URL and key, runs tests, edits per-model overrides | `src/options/ProvidersSection.tsx`, `src/options/Welcome.tsx` |
| Agent loop | Consumes `ResolvedModel.profile` for context budget, output cap, and screenshot inclusion | `src/agent/loop.ts`, `src/agent/context.ts` |

## Recommended Project Structure

No new top-level folders are needed. The feature lives inside the existing layers:

```text
src/
├── store/settings.ts            # ProviderConfig, ModelEntry, ProfileOverrides, keys
├── llm/
│   ├── profiles.ts              # resolveProfile precedence and probeAsk
│   ├── providers.ts             # OpenAI-compatible client factory
│   ├── model-info.ts            # /models facts
│   └── connection.ts            # testConnection, listModels
├── extension/models.ts          # resolveModel at run time
├── options/
│   ├── ProvidersSection.tsx     # provider/model UI and per-model overrides
│   └── Welcome.tsx              # first-run model setup
└── agent/
    ├── loop.ts                  # uses profile.contextWindow and profile.vision
    └── context.ts               # drops images for non-vision models
```

### Structure Rationale

- **`src/store/settings.ts` stays the only owner of provider data.** The LLM layer remains browser-agnostic and never reads `chrome.storage`; this keeps profiles testable with plain objects.
- **`src/llm/` owns all endpoint facts and probes.** Settings and Welcome call it directly; the agent never calls it.
- **`src/extension/models.ts` is the only place that turns stored provider data into a runnable model.** It is where local context detection and learned-fact writing belong, because both need Chrome/storage access.
- **UI changes are confined to `src/options/`.** The side panel and agent are unaffected except through the resolved profile.

## Architectural Patterns

### Pattern 1: Layered fact precedence for a model profile

**What:** A model's limits and vision come from the first source that states them: manual overrides, then what a probe or run learned (`tested`), then what the model API said (`fromApi`), then the catalogue row or endpoint default.

**When to use:** Always, for every provider kind. For custom OpenAI-compatible models the catalogue rarely knows the name, so overrides and probes carry the truth.

**Trade-offs:** Predictable and debuggable; the user's explicit value always wins. Requires every write path to preserve overrides.

**Example:**

```typescript
// src/llm/profiles.ts
contextWindow: overrides?.contextWindow || tested?.contextWindow || fromApi?.contextWindow || base.contextWindow,
maxOutput: overrides?.maxOutput || tested?.maxOutput || fromApi?.maxOutput || base.maxOutput,
vision: overrides?.vision ?? tested?.vision ?? fromApi?.vision ?? base.vision,
```

### Pattern 2: Overrides are per-model, not per-provider

**What:** `ModelEntry.overrides?: { contextWindow, maxOutput, vision }` lets two models on one endpoint have different limits. This is the core of the milestone.

**When to use:** Any endpoint that serves more than one model, especially OpenAI-compatible servers.

**Trade-offs:** More storage fields and UI inputs, but avoids wrong limits for one of several models.

### Pattern 3: Probe-driven detection with `ask` hints

**What:** `probeAsk(input)` reports which facts are still unknown. `testConnection(spec, options, ask)` then runs only the probes needed: tool calling always, reasoning on chat-completions kinds, None acceptance when a model reasons, and the image probe when vision is a guess.

**When to use:** When adding or re-testing a model, especially a custom one whose name is not in the catalogue.

**Trade-offs:** Costs a few short requests, but avoids assuming capabilities. Detection is best-effort and can be overridden by the user.

**Example:**

```typescript
// src/options/model-test.ts
const ask = probeAsk({ ...spec, overrides: stored?.overrides, tested: stored?.tested, fromApi: patch.fromApi });
const result = await testConnection(spec, {}, ask);
```

### Pattern 4: No-tool-calling gate

**What:** `ModelEntry.noToolCalling` marks a model that failed the tool probe. `usableModel` and `resolveModel` refuse to run the agent on such a model, and the default-model picker filters them out.

**When to use:** For every model, built-in or custom. The agent cannot function without tool calls.

**Trade-offs:** A model that only needs a longer output budget is not blocked; only a failed tool probe blocks it.

### Pattern 5: Vision gating through the profile

**What:** `profile.vision` is read by the agent loop and context builder. Non-vision models never receive screenshots or image attachments.

**When to use:** For custom models, where vision is auto-detected by the image probe and can be corrected manually through overrides.

**Trade-offs:** Keeps token usage down and avoids provider errors, but depends on detection or the user's override being right.

## Data Flow

### Add a custom model

```text
User enters base URL + key in Settings → Providers
    ↓
listModels(spec) reads /models from the endpoint
    ↓
User adds a model id (or picks from the list)
    ↓
testModel(provider, model, key, whole)
    → readModelInfo(spec)          (API facts, if any)
    → detectContext(spec)          (ollama/lmstudio only)
    → testConnection(spec, {}, ask) (tool calling, reasoning, None, vision)
    ↓
saveTest writes fromApi, tested, noToolCalling, detectedContext
    (overrides are preserved)
```

### Run the agent on a custom model

```text
livePair(conversationId)
    → usableModel(providers, stored model, default model)
    → filters out noToolCalling models
    ↓
resolveModel(pair)
    → findModel(provider, model)
    → reject if noToolCalling
    → detectContext again for ollama/lmstudio only
    → resolveProfile(kind, name, baseUrl, overrides, detectedContext, learned)
    → createModel(spec with maxOutputTokens = profile.maxOutput)
    ↓
Agent loop uses profile.contextWindow for compaction
    and profile.vision to gate screenshots/images
    ↓
learnFacts writes reasoning/output facts back to the entry
```

### Override edit flow (the missing wiring)

```text
User edits MAX_TOKENS / CONTEXT_WINDOW / vision on a ModelChip
    ↓
updateProvider(id, { models: models.map(m => m.name === name ? { ...m, overrides: { ... } } : m) })
    ↓
providersStorage (chrome.storage.local)
    ↓
resolveModel reads overrides on the next run
    ↓
resolveProfile applies them with highest precedence
```

### State Management

```text
ProviderConfig[] + keys  → chrome.storage.local (nb.providers, nb.keys)
ModelEntry.overrides     → same record, per model
LivePair                 → chrome.storage.session (nb.live.<conversationId>)
Learned facts            → written back through providersStorage.set
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single user, local extension | Current design is correct: storage is local, no server, no shared state |
| Many models on one endpoint | Per-model overrides and per-model noToolCalling marks keep behaviour correct |
| Slow or local endpoint | Tests queue one model at a time; context detection races a 2 s timeout |

### Scaling Priorities

1. **First bottleneck:** A provider listing or testing many models at once. Mitigation already in place: queued tests and a latest-answer guard (`listAsked`).
2. **Second bottleneck:** A custom model with no catalogue row gets cloud/local defaults. Mitigation: require or prompt for overrides, and treat detection as best-effort.

## Anti-Patterns

### Adding a new provider kind for custom models

**What people do:** Extend `ProviderKind` with `custom-openai` and add adapter code.

**Why it's wrong:** The Vercel AI SDK already covers any OpenAI-compatible endpoint; a new kind duplicates the default case and breaks catalogue and UI assumptions.

**Do this instead:** Reuse `openai-compatible` and store the base URL and model ids.

### Provider-level limits

**What people do:** Store one context window and max output on `ProviderConfig`.

**Why it's wrong:** Different models on one endpoint have different limits; one value is wrong for at least one model.

**Do this instead:** Keep limits on `ModelEntry.overrides`.

### Letting base-URL changes keep learned facts

**What people do:** Change an endpoint address but keep `tested`, `fromApi`, `detectedContext`, and `noToolCalling`.

**Why it's wrong:** Those facts describe the old server.

**Do this instead:** `withBaseUrl` already strips learned facts while preserving overrides; keep that behaviour.

### Overwriting overrides in the test path

**What people do:** Replace a `ModelEntry` wholesale when saving a test result.

**Why it's wrong:** The user's MAX_TOKENS/CONTEXT_WINDOW/vision edits disappear.

**Do this instead:** `saveTest` merges into the existing entry and must preserve `overrides`; the UI must patch only the fields it owns.

### Treating catalogue defaults as authoritative for custom models

**What people do:** Trust the cloud default (128k/8k/vision) for an unknown custom model.

**Why it's wrong:** A local or third-party model may be much smaller; compaction and output caps then misbehave.

**Do this instead:** Require or strongly prompt for overrides, and run the probe; detection only lowers the window.

### Running the agent on a model that failed the tool probe

**What people do:** Ignore `noToolCalling` to let a user try anyway.

**Why it's wrong:** The loop depends on tool calls; a non-tool model cannot complete a run.

**Do this instead:** Keep the `usableModel`/`resolveModel` gate and filter the default-model picker.

### Assuming context detection works for custom endpoints

**What people do:** Call `detectContext` for `openai-compatible`.

**Why it's wrong:** `detectContext` implements Ollama and LM Studio APIs only; a generic endpoint has no such endpoint.

**Do this instead:** Rely on overrides and API facts for custom models; detection stays limited to `ollama` and `lmstudio`.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI-compatible endpoint | HTTP chat completions at the user's base URL, Bearer key | Reuses the default case of `createModel`; user supplies the full base URL |
| Provider `/models` endpoint | `listModels` and `readModelInfo` | Fields vary; `factsFrom` reads only what the API states |
| Vercel AI SDK | `createOpenAI({ baseURL }).chat(modelName)` | No new dependency |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Options UI ↔ store | `chrome.storage.local` via `providersStorage`/`keysStorage` | UI never imports agent/extension |
| Options UI ↔ LLM layer | Direct function calls (`listModels`, `testModel`) | Allowed because `src/llm` is browser-agnostic |
| Extension resolver ↔ store | `providersStorage.get`, `keysStorage.get` | Reads key only to build the client |
| Extension resolver ↔ agent | `ResolvedModel` object | Contains `chat`, `profile`, `reasoning`, `learn` |
| Agent loop ↔ profile | `model.profile.contextWindow`, `.maxOutput`, `.vision` | Used for compaction and screenshot gating |

## Sources

- `src/store/settings.ts` — provider and model storage, overrides, learned facts
- `src/llm/profiles.ts` — profile precedence, `requestOutputLimit`, `probeAsk`
- `src/llm/providers.ts` — provider factory and OpenAI-compatible base URL handling
- `src/llm/model-info.ts` — vendor API fact parsing
- `src/llm/connection.ts` — tool-calling probe, image probe, model listing
- `src/extension/models.ts` — run-time resolution and local context detection
- `src/options/ProvidersSection.tsx` — provider/model UI
- `src/options/model-test.ts` — test orchestration and persistence
- `.planning/PROJECT.md` — milestone scope and constraints
- `.planning/codebase/ARCHITECTURE.md` — overall extension architecture

---
*Architecture research for: custom OpenAI-compatible model support*
*Researched: 2026-10-30*