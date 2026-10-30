# Phase 1: Settings UI & Validation - Research

**Researched:** 2026-10-30
**Domain:** React settings UI for custom OpenAI-compatible providers (per-model limits, vision override, provider toggle, base-URL normalization, search/filter)
**Confidence:** HIGH (all findings verified against the in-repo source listed in CONTEXT.md canonical refs)

## Summary

Phase 1 is a UI-and-validation phase on top of an already-complete data model. `ModelEntry.overrides` (`contextWindow`, `maxOutput`, `vision`), `detectedContext`, `fromApi`, and `tested` already exist in `src/store/settings.ts`, and `resolveProfile` in `src/llm/profiles.ts` already consumes `overrides` with the highest precedence. The work is: surface these in Settings → Providers (per-model expandable panel), add a provider enable/disable toggle, normalize/validate base URLs on blur, show detected-vs-set state, and add search/filter to the model list. No new dependencies, no schema migration beyond an optional `enabled` flag on `ProviderConfig`.

The main risk is regressions in the existing autorun checks (`model-picker`, `providers-key`, `providers-test`) which depend on current DOM labels and chip markup. Keep existing labels/aria-labels intact and add the new controls additively.

**Primary recommendation:** Implement entirely within `src/options/ProvidersSection.tsx` plus a small `enabled` field on `ProviderConfig` and a `normalizeBaseUrl` helper in `src/llm/providers.ts` (or locally). Reuse `DraftField`/`KeyField` patterns and the shared `Switch`, `Input`, `Notice`. Update all three locale JSON files together to keep the catalogue parity test green.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** MAX_TOKENS and CONTEXT_WINDOW are edited in an **expandable panel** on each model chip, keeping chips compact. — **Reversibility:** reversible
- **D-02:** Detected values are shown as **placeholders** with a small "detected" badge when the user has not overridden them. — **Reversibility:** reversible
- **D-03:** An **empty input reverts to the detected value** (or catalogue default when no detection). — **Reversibility:** reversible
- **D-04:** Inputs accept **positive integers only**; 0/negative/non-numeric values are rejected with an inline error. — **Reversibility:** reversible
- **D-05:** Vision is controlled by a **three-state toggle (Auto / On / Off)** in the expandable panel. — **Reversibility:** reversible
- **D-06:** Auto-detected vision is indicated by a **badge + tooltip** showing the detection source (probe/API). — **Reversibility:** reversible
- **D-07:** On conflict (user sets On but probe says no vision), the **manual override is authoritative**; the probe result is shown as info. — **Reversibility:** reversible
- **D-08:** The vision override is **exposed in Phase 1** (not deferred to probe-only). — **Reversibility:** reversible
- **D-09:** When collapsed, the chip shows an **eye icon** (filled when vision, outline when not). — **Reversibility:** reversible
- **D-10:** The toggle lives in the provider's **settings card** (alongside base URL/key). — **Reversibility:** reversible
- **D-11:** A disabled provider **hides its models from pickers** (default model / side panel). — **Reversibility:** reversible
- **D-12:** A disabled provider **does not run Test models** (saves requests). — **Reversibility:** reversible
- **D-13:** Disabled state is shown as a **dimmed card**. — **Reversibility:** reversible
- **D-14:** Base URL is **normalized on blur**: trailing slashes trimmed and `/v1` **auto-appended** if missing. — **Reversibility:** reversible
- **D-15:** Validation errors are shown **inline under the field**. — **Reversibility:** reversible
- **D-16:** Invalid URLs (bad scheme/host) are **saved with a warning** rather than blocked. — **Reversibility:** reversible
- **D-17:** Claude has discretion on the exact search/filter UX (threshold and placement) for large catalogues; default to an always-visible search box that filters the datalist when present. — **Reversibility:** reversible

### the agent's Discretion
- Search/filter placement and threshold (D-17).
- Exact badge/tooltip copy and styling.
- Expandable panel animation and layout details.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMOD-01 | Add OpenAI-compatible provider with custom base URL and API key | Already supported in `ProviderItem` (key/base URL lines); keep. |
| CMOD-02 | Add one or more model ids (manual + from `/models` list) | `addModel` + datalist; add search/filter (D-17). |
| CMOD-03 | Set per-model MAX_TOKENS and CONTEXT_WINDOW | Expandable panel inputs writing `overrides`. |
| CMOD-05 | Override (enable/disable) vision per model | Three-state Auto/On/Off in panel. |
| CMOD-06 | Show detected vs. user-set values | Placeholders + "detected" badge + eye icon. |
| CMOD-07 | Enable/disable provider without deleting | `enabled` flag + `Switch` in card. |
| CMOD-08 | Base URL normalized (trailing slash, `/v1`) | Normalize on blur (D-14). |
| CMOD-09 | Model list search/filter for large catalogues | Filter datalist (incl. hidden) by query. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Per-model limits UI | Frontend (Options) | — | React settings page; writes chrome.storage. |
| Provider enable/disable | Frontend (Options) | Store (chrome.storage) | Persisted on `ProviderConfig`; read by side panel. |
| Base URL normalization/validation | Frontend (Options) | LLM helpers | Pure string transform; no network. |
| Detected-vs-set display | Frontend (Options) | LLM profiles | Reads `ModelEntry` facts + `resolveProfile`. |
| Model list search/filter | Frontend (Options) | — | Client-side filter of fetched model names. |
| Hiding disabled providers from pickers | Frontend (Side panel) | Store | `models` memo filters `enabled !== false`. |

## Standard Stack

No new dependencies. Reuse existing:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 | Component UI | Project standard |
| Tailwind CSS | (project) | Styling | Project standard |
| zod | 4.6.7 | Validation (optional for URL schema) | Project standard |
| `@src/store/settings` | in-repo | `ProviderConfig`, `ModelEntry`, `ProfileOverrides`, `withBaseUrl` | Canonical data model |

**Installation:** none.

## Package Legitimacy Audit

No new external packages introduced in this phase. **N/A.**

## Architecture Patterns

### Recommended Project Structure (changes)
```
src/options/ProvidersSection.tsx   # main: provider toggle, ModelChip expansion, URL normalization, search
src/store/settings.ts              # add `enabled?: boolean` to ProviderConfig; filter in usableModel
src/llm/providers.ts               # add normalizeBaseUrl helper (optional, can live in component)
src/ui/locales/{en,zh_CN,zh_TW}.json  # new keys
```

### Pattern 1: Provider enable/disable toggle
Add `enabled?: boolean` to `ProviderConfig` (default treated as enabled via `!== false`, so old stored data keeps working). In `ProviderItem`:
- Add a `Line` with label "Enabled" and the shared `Switch` (checked = `provider.enabled !== false`), writing `updateProvider(id, { enabled })`.
- Dim the `<li>` when disabled: add `opacity-50` (or `opacity-60`) class conditionally.
- Guard `testAll` and `runTests` with `if (provider.enabled === false) return;`.
- Filter pickers: in `ProvidersSection` `choices` memo and side panel `models` memo, skip `p.enabled === false`.

### Pattern 2: Expandable panel on ModelChip
Convert `ModelChip` to manage `expanded` state locally. When expanded, render an inner panel with:
- CONTEXT_WINDOW number input (placeholder = detected context window, badge if not overridden).
- MAX_TOKENS (max output) number input.
- Vision three-state control (Auto/On/Off) + detected badge/tooltip.
- Collapsed row shows eye icon (filled when effective vision true).

Override writes go through `updateProvider` mapping the model. Keep `overrides` object; remove keys when reverted (empty input → delete `contextWindow`/`maxOutput`; Auto → delete `vision`).

Detected value computation (in `ProviderItem`, passed to chip):
- `detectedContextWindow = model.overrides?.contextWindow === undefined ? (model.tested?.contextWindow ?? model.fromApi?.contextWindow ?? (local ? model.detectedContext : undefined) ?? catalogueDefault) : undefined` — only meaningful when not overridden.
- `detectedMaxOutput = model.overrides?.maxOutput === undefined ? (model.tested?.maxOutput ?? model.fromApi?.maxOutput ?? catalogueDefault) : undefined`.
- Vision detected source: `model.fromApi?.vision !== undefined ? 'API' : model.tested?.vision !== undefined ? 'probe' : undefined`; detected value `model.fromApi?.vision ?? model.tested?.vision`.

Use `resolveProfile` for effective vision when needed; otherwise derive `effectiveVision = model.overrides?.vision ?? model.tested?.vision ?? model.fromApi?.vision ?? (catalogue row vision)`.

### Pattern 3: Base URL normalization on blur
Implement in `ProviderItem` (existing `onFocus`/`onBlur` already track `urlAtFocus`). On blur:
1. Compute `normalized = normalizeBaseUrl(provider.kind, provider.baseUrl ?? '')`: trim, strip trailing slashes, and if the kind is a chat-completions endpoint (ollama/lmstudio/openai-compatible) and the result does not already end in a version segment (`/v1`, `/v2`, …), append `/v1`.
2. If `normalized !== (provider.baseUrl ?? '')`, write via `withBaseUrl(provider, normalized)` (preserves overrides, clears learned facts — existing behavior).
3. Run tests if the URL actually changed from `urlAtFocus`.
4. Validation: derive `urlError = validateBaseUrl(raw)`; show inline `<p>` under the field when present (amber text). Do **not** block saving — store the raw/normalized value regardless.

Validation rules: parse with `new URL(...)` (prepend scheme if missing? treat as invalid); scheme must be `http:`/`https:`; hostname non-empty. Empty allowed (no error, no normalization).

### Pattern 4: Model list search/filter
In the model-add row, include hidden models in the datalist when the typed query is non-empty:
```
const showHidden = showAll || !!newModel.trim();
<datalist ...>{(showHidden ? [...listed.models, ...listed.hidden] : listed.models)
  .filter(n => !newModel.trim() || n.toLowerCase().includes(newModel.trim().toLowerCase()))
  .map(n => <option .../>)}</datalist>
```
This makes the existing input act as the always-visible search box (D-17).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Number validation | Custom regex state machine | Simple `/^\d+$/` + `Number() > 0` + inline error | D-04 |
| Switch control | New toggle component | Shared `Switch` from `src/ui/components.tsx` | Consistent a11y |
| URL parsing | Manual regex | `new URL()` with try/catch | Robust host/scheme |
| Detected value source | New detection logic | Reuse `model.tested`/`model.fromApi`/`model.detectedContext` | Already populated by Test models |

## Runtime State Inventory

Not applicable — this phase adds no rename/migration. Provider storage remains `nb.providers` with additive `enabled` field (default enabled).

## Common Pitfalls

### Pitfall 1: Catalogue parity test
**What goes wrong:** Adding i18n keys to `en.json` only breaks `src/ui/__tests__/catalogues.test.ts`.
**How to avoid:** Add every new key to `zh_CN.json` and `zh_TW.json` with translations (or matching placeholders) in the same change.

### Pitfall 2: `withBaseUrl` clearing facts
**What goes wrong:** Normalizing on blur triggers `withBaseUrl`, which clears `detectedContext`/`tested`/`fromApi` when the string differs — even if the logical URL is the same (e.g. trailing slash).
**How to avoid:** Compare normalized result to the stored value; only call `withBaseUrl` when they differ. Already guarded by `withBaseUrl`'s early return when equal.

### Pitfall 3: Disabled provider default model
**What goes wrong:** A disabled provider's model remains the default model and still appears in the side panel.
**How to avoid:** Filter `enabled !== false` in the side panel `models` memo and in `ProvidersSection` choices. Optionally clear `defaultModel` when its provider becomes disabled (not required by scope; hiding from picker suffices for D-11).

### Pitfall 4: Auto-save number inputs and cursor jumps
**What goes wrong:** Writing to storage on every keystroke can re-render and reset input focus/cursor.
**How to avoid:** Keep a local `draft` string in the input; commit to storage on valid change; use `useStorage` snapshot for the committed value. (Mirrors `DraftField`.)

### Pitfall 5: Vision effective value vs. override
**What goes wrong:** Showing the catalogue default as "detected" even when no detection exists.
**How to avoid:** Only show the "detected" badge when `model.tested?.vision` or `model.fromApi?.vision` is defined; otherwise show plain Auto with no source badge.

### Pitfall 6: Existing autorun checks
**What goes wrong:** `model-picker`, `providers-key`, `providers-test` assert specific DOM; adding controls must not remove existing aria-labels/buttons.
**How to avoid:** Keep existing `aria-label`s (`Default model`, `Reasoning effort`, `Test models`, etc.) unchanged; add new controls with new labels only.

## Code Examples

### Expandable chip skeleton
```tsx
// In ModelChip
const [expanded, setExpanded] = useState(false);
return (
  <li className="...">
    <button onClick={() => setExpanded(e => !e)} aria-expanded={expanded}>
      {passed ? <CheckIcon ... /> : null}
      <span className="font-mono">{model.name}</span>
      {visionOn ? <EyeIcon size={14} /> : <EyeIcon size={14} className="opacity-40" />}
      <ChevronIcon size={12} className={expanded ? 'rotate-90' : ''} />
    </button>
    {expanded ? (
      <div className="mt-2 flex flex-col gap-2 border-t pt-2">
        {/* CONTEXT_WINDOW, MAX_TOKENS, vision toggle */}
      </div>
    ) : null}
  </li>
);
```

### normalizeBaseUrl
```ts
export function normalizeBaseUrl(kind: ProviderKind, raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  const localish = kind === 'ollama' || kind === 'lmstudio' || kind === 'openai-compatible';
  if (localish && !/\/v\d+$/.test(trimmed)) return `${trimmed}/v1`;
  return trimmed;
}
```

### Validation
```ts
function validateBaseUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  let url: URL;
  try { url = new URL(v); } catch { return 'Invalid URL'; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'URL must use http or https';
  if (!url.hostname) return 'URL needs a host';
  return null;
}
```

### Vision three-state
```tsx
const visionState: 'auto' | 'on' | 'off' =
  model.overrides?.vision === true ? 'on' : model.overrides?.vision === false ? 'off' : 'auto';
// Auto -> delete overrides.vision; On -> true; Off -> false
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `reasoningSupport` legacy field | `tested`/`fromApi` facts | Already migrated; keep reading via `learnt()`. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `enabled` defaults to "enabled" via `!== false` rather than a storage migration | Architecture | Old providers stay enabled (correct desired default). |
| A2 | Auto-appending `/v1` applies to `openai-compatible` too (D-14) | Pattern 3 | Some endpoints may not use `/v1`; but D-14 says auto-append if missing, so follow. |
| A3 | zh_CN/zh_TW translations for new keys will be provided during implementation | Pitfall 1 | Catalogue test fails otherwise; plan must include translation task. |
| A4 | Badge copy ("detected", "probe"/"API") wording | Discretion | Cosmetic; low risk. |

## Open Questions

1. **Should disabling a provider clear its selection as default model?** 
   - What we know: D-11 only hides from pickers.
   - Recommendation: hide only; don't mutate settings (less destructive). Phase 4 may revisit.

2. **Should the model-add search box also filter the chips already added?**
   - Recommendation: no; filter only the fetched list (D-17 scope).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / pnpm | Build/test | ✓ | 24 LTS / 10.34.7 | — |
| Chrome (Testing) | Autorun checks | ✓ | installed via pnpm install-chrome | — |
| Vitest | Unit tests | ✓ | 5.0.5 | — |

## Security Domain

**Applicable ASVS categories:**

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | `new URL()` + positive-integer regex |
| V6 Cryptography | no | Keys handled by existing `keysStorage` |

**Known threat patterns:**

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| URL injection (javascript:/data:) | Tampering | Reject non-http(s) schemes; save with warning |
| Stored XSS via model names | Tampering | React text nodes only; no `dangerouslySetInnerHTML` |
| Invalid numeric override causing NaN | Tampering | Positive-integer regex before commit |

## Sources

### Primary (HIGH confidence)
- `src/store/settings.ts` (lines 73-93, 108-134) — `ProfileOverrides`, `ModelEntry`, `ProviderConfig`, `withBaseUrl`
- `src/llm/profiles.ts` (lines 88-108) — `resolveProfile` precedence
- `src/options/ProvidersSection.tsx` (full) — existing UI patterns
- `src/options/model-test.ts` — test/save flow
- `src/ui/components.tsx` — shared `Switch`, `Input`, `Notice`
- `src/ui/locales/en.json` + `catalogues.test.ts` — i18n parity constraint

### Secondary (MEDIUM confidence)
- CONTEXT.md canonical refs (verified by reading the cited files above)

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps
- Architecture: HIGH — all data model already present
- Pitfalls: HIGH — derived from codebase tests/conventions

**Research date:** 2026-10-30
**Valid until:** 2026-11-30 (stable codebase)
