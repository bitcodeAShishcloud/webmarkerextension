# Nanobrowser

## What This Is

Nanobrowser is a Chrome/Edge extension that automates the web with a single in-browser AI agent: a deterministic browser-control layer (observe, act, report) sits underneath an agent loop that drives it through the Vercel AI SDK. Users bring their own model provider keys, and the agent works on the tabs they allow, under one of three permission modes. This milestone focuses on letting users add and run their own OpenAI-compatible models (custom base URL, key, model id, max output tokens, context window) instead of only the built-in providers.

## Core Value

The agent must run correctly on a model the user configures themselves — tool calls work, and the context and output limits the user states are respected — so Nanobrowser is not locked to a fixed provider list.

## Requirements

### Validated

- ✓ Browser-control layer (CDP via chrome.debugger + Puppeteer frames, refs, perception, interaction, sessions, lifecycle) — existing
- ✓ Side panel per tab with one agent loop and context compaction — existing
- ✓ Model providers through the Vercel AI SDK (Anthropic, OpenAI, Gemini, OpenRouter, Ollama, LM Studio, OpenAI-compatible presets) — existing
- ✓ Permission modes (Ask default, Auto, site rules) with strict enforcement for pay/access/secret/prompt — existing
- ✓ Shortcuts, attachments (images and text), upload into pages, saved files — existing
- ✓ Voice input via OpenAI/Gemini voice models — existing
- ✓ Three UI languages (English, Simplified/Traditional Chinese) — existing
- ✓ Glowing border on pages the agent works on (toggle in Settings) — existing
- ✓ Anonymous, identifier-free analytics (daily users + usage counts) — existing
- ✓ Rating card for frequent users — existing

### Active

- [ ] User can add an OpenAI-compatible provider with a custom base URL and API key in Settings → Providers
- [ ] User can add one or more model ids to that provider and set per-model MAX_TOKENS (max output) and CONTEXT_WINDOW
- [ ] The per-model limits feed the model profile (context window, max output) used by the agent loop
- [ ] Test models probes tool calling (and auto-detects vision) for custom models and marks models that cannot tool-call
- [ ] A custom model with tool calling can be selected as the default model and used to run the agent
- [ ] Vision capability is auto-detected and used to gate the screenshot tool

### Out of Scope

- Fully generic (non-OpenAI-compatible) provider adapters — deferred; only OpenAI-compatible endpoints in v1
- Per-model API keys — the provider's key is shared by all its models, as today
- New provider kinds or changes to the ProviderKind union beyond reuse of `openai-compatible`
- Azure OpenAI support — not offered in this version
- Skills, site notes, saved memory, in-page Stop pill, PDF/Office parsing, text tool-call parser, scheduled tasks — not in first release (per AGENTS.md)
- MCP bridge, non-Chrome/Edge browsers, planner/navigator design, multiple cooperating agents — not in scope

## Context

Brownfield Chrome MV3 extension (TypeScript, React 18, WXT, Vercel AI SDK, Puppeteer, zod). Codebase mapped in `.planning/codebase/` (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS). Providers and keys live in `chrome.storage.local` (`nb.providers`, `nb.keys`); models are `ModelEntry` with an `overrides?: { contextWindow, maxOutput, vision }` field that already feeds `resolveProfile`. The Settings → Providers UI (`src/options/ProvidersSection.tsx`) already supports OpenAI-compatible providers with base URL, key, model list and Test models; what is missing is exposing MAX_TOKENS/CONTEXT_WINDOW (and vision) per model in the UI and wiring them through. The catalogue/profile resolution and model test probe already consume overrides.

## Constraints

- **Tech stack**: TypeScript 6, React 18, WXT, Vercel AI SDK, Chrome MV3 — no new dependencies
- **Reuse**: build on the existing `openai-compatible` provider kind and `ModelEntry.overrides`; do not add a new provider kind
- **Compatibility**: Chrome and Edge only
- **Security**: API keys never logged, exported or sent anywhere but their provider; mask values in page content
- **Import rules**: layer untouched; `src/llm` stays browser-agnostic; UI never imports agent/extension

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Reuse `openai-compatible` kind for custom models | Vercel AI SDK already covers any OpenAI-compatible endpoint; avoids new adapter code | — Pending |
| Per-model overrides (maxOutput, contextWindow, vision) rather than provider-level limits | Different models on one endpoint can have different limits | — Pending |
| Auto-detect tool calling and vision via the existing Test models probe | Detection is best-effort and already implemented; manual override stays available through overrides | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-30 after initialization*