# Roadmap: WebMarker Extensions

## Overview

WebMarker Extensions already speaks the OpenAI Chat Completions protocol for arbitrary endpoints and already stores per-model overrides, so this milestone is wiring rather than new infrastructure: expose per-model limits and vision in Settings, wire them safely through profile resolution, harden the test probes, and verify end-to-end agent runs on a user-configured model.

## Phases

- [x] **Phase 1: Settings UI & Validation** - Per-model limits, vision override, provider toggle, base-URL normalization, detected-vs-set display, i18n (completed 2026-10-30)
- [x] **Phase 2: Profile Wiring & Validation** - Overrides feed resolveProfile with safe clamping, local concurrency limits (completed 2026-10-31)
- [x] **Phase 3: Test Probe Robustness** - Tool-calling and vision probes with false-positive/negative mitigations (completed 2026-10-31)
- [x] **Phase 4: Agent Integration** - Screenshot gating, usage-null degradation, CORS docs, end-to-end run (completed 2026-10-31)

## Phase Details

### Phase 1: Settings UI & Validation

**Goal**: Users can enter and manage per-model limits, vision, and provider settings with validation
**Depends on**: Nothing (first phase)
**Requirements**: CMOD-01, CMOD-02, CMOD-03, CMOD-05, CMOD-06, CMOD-07, CMOD-08, CMOD-09
**Success Criteria** (what must be TRUE):
  1. User can add an OpenAI-compatible provider with a custom base URL and API key in Settings → Providers
  2. User can add one or more model ids (manual entry and from the `/models` list) and search/filter large catalogues
  3. User can set per-model MAX_TOKENS (max output) and CONTEXT_WINDOW and override (enable/disable) vision per model
  4. Settings shows detected vs. user-set values for context window, max output, and vision
  5. User can enable/disable a provider without deleting it
  6. Base URL is normalized (trailing slash trimmed) and validated for scheme/host

**Plans**: 2/2 plans complete

Plans:
- [x] 01-01-PLAN.md — Provider enable/disable toggle, per-model expandable limits/vision panel, detected-vs-set display
- [x] 01-02-PLAN.md — Base URL normalization/validation on blur, model list search/filter, helper unit tests

**UI hint**: yes

### Phase 2: Profile Wiring & Validation

**Goal**: Per-model limits and vision feed resolveProfile safely, and local endpoints are concurrency-limited
**Depends on**: Phase 1
**Requirements**: CMOD-04
**Success Criteria** (what must be TRUE):
  1. Per-model limits feed `resolveProfile` (context window, max output) used by the agent loop and compaction
  2. User-entered context window is clamped to the server-reported value when both exist (`Math.min`)
  3. `requestOutputLimit` honors the user's cap (floor `Math.min(profile.maxOutput, 1024)`)
  4. Overrides survive `withBaseUrl` and `saveTest` merges (regression tested)
  5. Local custom endpoints (localhost) get `maxConcurrent: 1` via `isCloudEndpoint(kind, baseUrl)`

**Plans**: 1/1 plans complete

Plans:
- [x] 02-01-PLAN.md — Profile wiring: clamp context window, honor output cap, local concurrency, override-survival regression tests

### Phase 3: Test Probe Robustness

**Goal**: Tool-calling and vision detection are accurate and don't misclassify models
**Depends on**: Phase 2
**Requirements**: CMOD-10, CMOD-11
**Success Criteria** (what must be TRUE):
  1. Test models probes tool calling and marks models that cannot tool-call; such models cannot be selected as default
  2. Vision probe requires the answer to contain "red"; a non-matching 200 yields `vision = false`/unknown, with manual override authoritative
  3. Tool probe uses `Math.max(1024, userMaxOutput)` capped at 4096 and retries once at 4096 on `CUT_SHORT` before marking `noToolCalling`
  4. Probe failures surface the server's exact 400 body; streaming/usage is treated as optional (estimate when null)

**Plans**: 1/1 plans complete

Plans:
- [x] 03-01-PLAN.md — Tool probe cap sizing with 4096 retry, red-gated vision probe, exact 400 surfacing

### Phase 4: Agent Integration:

**Goal**: A custom tool-calling model runs the agent with correct vision gating and usage handling
**Depends on**: Phase 3
**Requirements**: CMOD-12
**Success Criteria** (what must be TRUE):
  1. A custom model with tool calling can be selected as the default model and used to run the agent
  2. Screenshot tool is registered only when `profile.vision === true` (verified by a test flipping `overrides.vision`)
  3. Context management degrades gracefully when usage comes back null (estimation)
  4. CORS-blocked endpoints surface a distinct status-0 error and document origin allowance

**Plans**: 8/8 plans complete

Plans:
**Wave 1**
- [x] 04-01-PLAN.md - Robustness edits: strict screenshot gating, null-usage guard, CORS notice
- [x] 04-03-PLAN.md - Rebrand product identity to WebMarker Extensions across UI strings, docs, metadata and links
- [x] 04-04-PLAN.md - Replace toolbar icons and UI logo with the WebMaker W mark and horizontal lockup
- [x] 04-05-PLAN.md - Colour theme: white canvas, #C15F3C terracotta accent, #B1ADA1 borders, coherent dark mode
- [x] 04-06-PLAN.md - All-white canvas in both themes: white tokens, dereferenced blue/navy backgrounds, byte-identical brand assets
- [x] 04-07-PLAN.md - Warm-gray canvas in both themes: #B1ADA1 tokens, derived AA shades, accent-as-text removed, byte-identical brand assets
- [x] 04-08-PLAN.md - Low-contrast text fix: darker muted token and explicit placeholder colour on the warm-gray canvas

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 04-02-PLAN.md - Verification tests

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Settings UI & Validation | 2/2 | Complete    | 2026-10-30 |
| 2. Profile Wiring & Validation | 1/1 | Complete    | 2026-10-31 |
| 3. Test Probe Robustness | 1/1 | Complete    | 2026-10-31 |
| 4. Agent Integration | 8/8 | Complete    | 2026-11-27 |
