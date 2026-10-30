# Phase 1: Settings UI & Validation - Context

**Gathered:** 2026-10-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the Settings UI for custom OpenAI-compatible models: per-model MAX_TOKENS (max output) and CONTEXT_WINDOW inputs, a per-model vision override, a provider enable/disable toggle, base URL normalization and validation, detected-vs-set display, and model list search/filter. It does not change profile resolution (Phase 2), probe logic (Phase 3), or agent integration (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Per-model limits inputs
- **D-01:** MAX_TOKENS and CONTEXT_WINDOW are edited in an **expandable panel** on each model chip, keeping chips compact. — **Reversibility:** reversible
- **D-02:** Detected values are shown as **placeholders** with a small "detected" badge when the user has not overridden them. — **Reversibility:** reversible
- **D-03:** An **empty input reverts to the detected value** (or catalogue default when no detection). — **Reversibility:** reversible
- **D-04:** Inputs accept **positive integers only**; 0/negative/non-numeric values are rejected with an inline error. — **Reversibility:** reversible

### Vision override UI
- **D-05:** Vision is controlled by a **three-state toggle (Auto / On / Off)** in the expandable panel. — **Reversibility:** reversible
- **D-06:** Auto-detected vision is indicated by a **badge + tooltip** showing the detection source (probe/API). — **Reversibility:** reversible
- **D-07:** On conflict (user sets On but probe says no vision), the **manual override is authoritative**; the probe result is shown as info. — **Reversibility:** reversible
- **D-08:** The vision override is **exposed in Phase 1** (not deferred to probe-only). — **Reversibility:** reversible
- **D-09:** When collapsed, the chip shows an **eye icon** (filled when vision, outline when not). — **Reversibility:** reversible

### Provider enable/disable toggle
- **D-10:** The toggle lives in the provider's **settings card** (alongside base URL/key). — **Reversibility:** reversible
- **D-11:** A disabled provider **hides its models from pickers** (default model / side panel). — **Reversibility:** reversible
- **D-12:** A disabled provider **does not run Test models** (saves requests). — **Reversibility:** reversible
- **D-13:** Disabled state is shown as a **dimmed card**. — **Reversibility:** reversible

### Base URL normalization & validation
- **D-14:** Base URL is **normalized on blur**: trailing slashes trimmed and `/v1` **auto-appended** if missing. — **Reversibility:** reversible
- **D-15:** Validation errors are shown **inline under the field**. — **Reversibility:** reversible
- **D-16:** Invalid URLs (bad scheme/host) are **saved with a warning** rather than blocked. — **Reversibility:** reversible

### Model list search/filter
- **D-17:** Claude has discretion on the exact search/filter UX (threshold and placement) for large catalogues; default to an always-visible search box that filters the datalist when present. — **Reversibility:** reversible

### Claude's Discretion
- Search/filter placement and threshold (D-17).
- Exact badge/tooltip copy and styling.
- Expandable panel animation and layout details.

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Settings & store
- `src/options/ProvidersSection.tsx` — provider/model UI; `ProviderItem`, `ModelChip`, `DraftField`, `KeyField`
- `src/store/settings.ts` — `ModelEntry`, `ProfileOverrides`, `withBaseUrl`, `learnFacts`, `ProviderConfig`
- `src/options/model-test.ts` — `testModel`, `saveTest`, `wholeTestOnAdd`, `listProblem`

### LLM / profiles
- `src/llm/profiles.ts` — `resolveProfile`, `probeAsk`, precedence chain
- `src/llm/model-info.ts` — `factsFrom`, `readModelInfo`
- `src/llm/providers.ts` — `openAICompatibleBaseUrl`, `createModel`

### UI / i18n
- `src/ui/components.tsx` — shared `Input`, `Button`, `Select`, `Notice`
- `src/ui/locales/{en,zh_CN,zh_TW}.json` — i18n catalogues

### Codebase conventions
- `.planning/codebase/CONVENTIONS.md` — naming, formatting, import rules
- `.planning/codebase/STRUCTURE.md` — where to add new code

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DraftField` / `KeyField` in `ProvidersSection.tsx` — draft/save/cancel pattern reusable for number inputs.
- `ModelChip` — already shows model name + test status; expandable panel can be added here.
- `withBaseUrl` — preserves `overrides` on base URL change (keep this behavior).
- `resolveProfile` — already consumes `overrides` with highest precedence.

### Established Patterns
- React functional components with hooks; `useStorage` for chrome.storage-backed state.
- Tailwind utility classes; dark mode via `dark:` variants.
- i18n via `t('...')` with keys in three locale JSON files.

### Integration Points
- `providersStorage.set(...)` for persisting overrides.
- `keysStorage` for API keys.
- `settingsStorage` for default model selection (filtered by `noToolCalling`).

</code_context>

<specifics>
## Specific Ideas

- Expandable panel on each model chip for limits + vision toggle.
- Eye icon on collapsed chip for vision state.
- Inline validation errors under base URL and number inputs.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 01-settings-ui-validation*
*Context gathered: 2026-10-30*