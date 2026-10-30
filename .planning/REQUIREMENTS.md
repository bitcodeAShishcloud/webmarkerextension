# Requirements: Nanobrowser (Custom Model Support)

**Defined:** 2026-10-30
**Core Value:** The agent must run correctly on a model the user configures themselves — tool calls work, and the context and output limits the user states are respected.

## v1 Requirements

### Custom Models

- [ ] **CMOD-01**: User can add an OpenAI-compatible provider with a custom base URL and API key in Settings → Providers
- [ ] **CMOD-02**: User can add one or more model ids to a custom provider (manual entry and from the `/models` list)
- [ ] **CMOD-03**: User can set per-model MAX_TOKENS (max output) and CONTEXT_WINDOW values
- [ ] **CMOD-04**: Per-model limits feed `resolveProfile` (context window, max output) used by the agent loop and compaction
- [ ] **CMOD-05**: User can override (enable/disable) vision per model
- [ ] **CMOD-06**: Settings shows detected vs. user-set values for context window, max output, and vision
- [ ] **CMOD-07**: User can enable/disable a provider without deleting it
- [ ] **CMOD-08**: Base URL is normalized (trailing slash, `/v1` handling) for custom endpoints
- [ ] **CMOD-09**: Model list supports search/filter for large catalogues
- [ ] **CMOD-10**: Test models probes tool calling and marks models that cannot tool-call; such models cannot be selected as default
- [ ] **CMOD-11**: Vision capability is auto-detected and gates the screenshot tool
- [ ] **CMOD-12**: A custom model with tool calling can be selected as the default model and used to run the agent

## v2 Requirements

### Custom Models

- **CMOD-13**: Model management for local servers (load/unload) — server's responsibility
- **CMOD-14**: Custom HTTP headers / auth schemes beyond Bearer — revisit on demand
- **CMOD-15**: Per-model cost dashboards — keep minimal usage accounting only

## Out of Scope

| Feature | Reason |
|---------|--------|
| Fully generic (non-OpenAI-compatible) provider adapters | Reuse `openai-compatible` kind; no new adapter code |
| Per-model API keys | Provider key shared by all its models |
| New `ProviderKind` variants | Breaks catalogue/profile/switch logic; not needed |
| Azure OpenAI support | Different auth/URL shape; deferred |
| Local model download/load/unload management | Wrong layer (server's job) |
| Cloud sync / export of providers or keys | Keys must never leave the browser |
| Text tool-call parser for models without native tool calling | Agent requires native tool calls; mark `noToolCalling` |
| Skills, site notes, saved memory, in-page Stop pill, PDF/Office parsing, scheduled tasks | Not in first release (per AGENTS.md) |
| MCP bridge, non-Chrome/Edge browsers, planner/navigator, multiple agents | Not in scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CMOD-01 | Phase 1 | Pending |
| CMOD-02 | Phase 1 | Pending |
| CMOD-03 | Phase 1 | Pending |
| CMOD-05 | Phase 1 | Pending |
| CMOD-06 | Phase 1 | Pending |
| CMOD-07 | Phase 1 | Pending |
| CMOD-08 | Phase 1 | Pending |
| CMOD-09 | Phase 1 | Pending |
| CMOD-04 | Phase 2 | Pending |
| CMOD-10 | Phase 3 | Pending |
| CMOD-11 | Phase 3 | Pending |
| CMOD-12 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-30*
*Last updated: 2026-10-30 after initial definition*