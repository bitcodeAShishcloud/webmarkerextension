---
last_mapped_commit: 19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458
last_mapped_at: 2026-10-30
---
<!-- refreshed: 2026-10-30 -->

# Architecture

**Analysis Date:** 2026-10-30

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│  Chrome MV3 service worker (entrypoints/background.ts)                │
│  ┌────────────────────────┬──────────────────────┬─────────────────┐  │
│  │  Product wiring         │  Test extension      │  Layer          │  │
│  │  src/extension/         │  src/background/     │  browser-control │  │
│  │  RunManager, bindings   │  checks, scenarios   │  (deterministic)│  │
│  └────────┬────────────────┴──────────┬───────────┴────────┬────────┘  │
│           │                            │                    │          │
│           ▼                            ▼                    ▼          │
│  ┌────────────────────┐      ┌────────────────────┐   chrome.debugger  │
│  │  Panels (React UI)  │      │  Test panel        │   Puppeteer frames │
│  │  src/side-panel/    │      │  src/test-panel/   │   CDP sessions     │
│  │  src/options/       │      │                    │                    │
│  └────────────────────┘      └────────────────────┘                    │
└──────────────────────────────────────────────────────────────────────┘
         │ panel protocol (chrome.runtime Port)        │
         ▼                                             ▼
   Side panel / Options pages (React)           Fixture server (8787)
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Background entry | Synchronous listener registration; imports product wiring and test extension | `entrypoints/background.ts` |
| Browser control layer | Deterministic observe/act on pages via CDP; sessions, refs, frames, perception, interaction | `src/browser-control/` (only import `index.ts`) |
| Product controller factory | One Chrome-wired controller (debugger + Puppeteer + tabs) | `src/browser-control/index.ts` (`createChromeController`) |
| Product wiring | RunManager, PromptBroker, permissions, TabScope, downloads, notifications, border | `src/extension/` |
| Agent loop | One agent per conversation; turns, tools, context management, run records | `src/agent/loop.ts` |
| LLM gateway | Providers, profiles, streaming, usage, overflow, transcription | `src/llm/` |
| Stores | IndexedDB schema (idb), settings, keys, conversations, blobs | `src/store/` |
| UI (shared) | Components, theme, i18n runtime, protocol types, locales | `src/ui/` |
| Side panel | Chat UI; talks to worker via panel protocol | `src/side-panel/` |
| Options | Settings UI | `src/options/` |
| Test panel | Layer developer UI (React) | `src/test-panel/` |
| Test extension | Checks, scenarios, test panel messages, autorun | `src/background/` |
| Fixtures | Static pages, fixture server, Chrome launcher | `fixtures/` |

## Pattern Overview

**Overall:** Layered Chrome extension with a deterministic browser-control layer at the bottom and an AI agent loop above it, communicating through typed interfaces and a chrome.runtime port protocol.

**Key Characteristics:**
- The browser control layer is in-process and deterministic; no model inside it.
- The agent reaches Chrome only through interfaces passed in by `src/extension/` (LayerPort/HostPort), so it runs with fakes in tests.
- UI surfaces never import agent/extension/background; they talk to the worker over one typed port protocol (`src/ui/protocol.ts`).
- `src/llm/` is browser-agnostic.
- Import rules are enforced by ESLint (`import/no-restricted-paths`, `no-restricted-imports`).

## Layers

**Browser control layer (`src/browser-control/`):**
- Purpose: Observe pages, act on them, report outcomes deterministically.
- Location: `src/browser-control/`
- Contains: protocol (schemas, errors, catalogue), core (controller, sessions, refs, frames, perception, interaction, tools, lifecycle), host (Puppeteer, CDP session, chrome.debugger, tabs), probe (in-page code), index (public entry).
- Depends on: nothing outside the folder (enforced).
- Used by: `src/extension/`, `src/background/`, `src/test-panel/` (only via `index.ts`).

**Extension layer (`src/extension/`):**
- Purpose: Product wiring in the service worker: runs, permissions, tab scope, downloads, notifications, border, prompts.
- Location: `src/extension/`
- Contains: `RunManager`, `TabScope` (`bindings.ts`), `PromptBroker`, `Permissions`, `PageBorder`, `Journal`, models, analytics.
- Depends on: browser-control (`index.ts`), agent, store, llm, ui.
- Used by: side panel/options indirectly via messages; entrypoints.

**Agent layer (`src/agent/`):**
- Purpose: Loop, hooks, agent tools, prompts, context management, run records.
- Location: `src/agent/`
- Contains: `AgentLoop` (`loop.ts`), context, compaction, elision, completion, guards, records, attachments, display.
- Depends on: browser-control types, llm, store. Reaches Chrome only via ports.
- Used by: `src/extension/run-manager.ts`.

**LLM layer (`src/llm/`):**
- Purpose: Providers, model profiles, streaming, usage accounting, overflow detection, transcription.
- Location: `src/llm/`
- Contains: `providers.ts`, `catalogue.ts`, `profiles.ts`, `stream.ts`, `connection.ts`, `limiter.ts`, `overflow.ts`, `errors.ts`, `model-info.ts`, `scripted.ts`, `transcribe.ts`.
- Depends on: ai SDK, zod. Knows nothing about browsers.
- Used by: extension, agent (via extension).

**Store layer (`src/store/`):**
- Purpose: IndexedDB schema and stores, settings, keys, conversations, blobs, shortcuts, legacy migration, analytics, rating, whats-new.
- Location: `src/store/`
- Contains: `db.ts` (idb, version 1), `conversations.ts`, `settings.ts`, `storage.ts`, `attachments.ts`, `shortcuts.ts`, `legacy.ts`, `analytics.ts`, `rating.ts`, `whats-new.ts`, `types.ts`.
- Depends on: idb.
- Used by: extension, agent, ui (types).

**UI layer (`src/ui/`):**
- Purpose: Shared components, theme, i18n runtime and catalogues, panel protocol types.
- Location: `src/ui/`
- Contains: `protocol.ts`, `i18n.ts`, `language.tsx`, `theme.ts`, `components.tsx`, `icons.tsx`, `hooks.ts`, `shortcuts.tsx`, `mode-menu.tsx`, `auto-notice.tsx`, `optional-permissions.ts`, `manifest-permissions.ts`, `whats-new.ts`, `voice.ts`, `links.ts`, locales (`en.json`, `zh_CN.json`, `zh_TW.json`).
- Depends on: React. Never imports agent/extension/background.
- Used by: side-panel, options, test-panel.

**Side panel / Options (React apps):**
- Purpose: Chat UI and settings UI; communicate with worker via panel protocol.
- Location: `src/side-panel/`, `src/options/`.
- Depends on: ui, store (read-only via messages). Never imports agent/extension.

**Test extension (`src/background/`):**
- Purpose: Layer's test harness in the worker: hosts layer, relays test panel, runs checks and scenarios, autorun.
- Location: `src/background/`.
- Depends on: browser-control, ui.
- Used by: `entrypoints/background.ts` (dev/autorun builds).

**Host (Chrome APIs):**
- Purpose: Chrome-specific adapters: `chrome.debugger`, Puppeteer frame topology, `chrome.tabs`, `chrome.storage`.
- Location: `src/browser-control/host/`.
- Depends on: Chrome APIs, puppeteer-core.

## Data Flow

### Primary Request Path (user message → agent run)

1. User types in side panel → `PanelClient.send({ type: 'send', ... })` (`src/side-panel/client.ts`).
2. Worker `RunManager.handle` (`src/extension/run-manager.ts`) receives command over chrome.runtime Port.
3. RunManager creates conversation, appends user entry, subscribes panel; calls `#launch`.
4. `#launch` opens a `Session` via `createAgentSession` (`src/extension/agent-session.ts`) backed by the Chrome controller.
5. `AgentLoop.run()` (`src/agent/loop.ts`) streams a model turn via `src/llm/stream.ts`, then dispatches tool calls through `LayerPort.call` → `Session.call` → tool handlers (`src/browser-control/core/tools/`).
6. Tool results are rendered, recorded (`RunWriter`), and emitted as `AgentEvent`s back over the journal to the panel.
7. Loop repeats until `done` or a guard/context limit; RunManager writes run record and status.

### Secondary Flow: Tab scoping / sharing

1. `TabScope` (`src/extension/bindings.ts`) persists tab→conversation map in `chrome.storage.session`.
2. User shares tab → `TabScope.add` groups tab, enables side panel on it, emits `changed`.
3. RunManager's `#scopeChanged` shares/unshares tabs in the session and updates panels.

### Secondary Flow: Hand-over (user step)

1. Layer refuses a consequential action with `USER_STEP` error.
2. `AgentLoop.afterToolCall` / `#handOver` stores partial result, opens hand-over card via `HostPort`.
3. `PromptBroker` (`src/extension/prompt-broker.ts`) routes prompt to the panel owning the tab.
4. User acts on page, gives back/cancels; loop resumes with fresh snapshot.

### State Management

- Conversation/entry/run state: IndexedDB via `src/store/db.ts` (idb), accessed through `src/store/conversations.ts`.
- Tab scope: `chrome.storage.session` (`src/extension/bindings.ts`).
- Settings/keys: `chrome.storage.local` (`src/store/settings.ts`).
- Layer state: in-memory per tab in Controller; invalidated on navigation/detach/restart (epoch-based refs).
- Run state survives worker restarts via `RunRecord` in IndexedDB and `restore()`.

## Key Abstractions

**Controller / Session (browser-control):**
- Purpose: Owns tabs, refs, attachments, tool dispatch; sessions hold tab sets and policies.
- Examples: `src/browser-control/core/controller.ts` (`Controller`, `Session`).
- Pattern: One controller per Chrome; many sessions; refs scoped by epoch + document.

**LayerPort / HostPort (agent):**
- Purpose: Small interfaces decoupling agent from Chrome and UI.
- Examples: `src/agent/ports.ts`.
- Pattern: Dependency injection for testability (fake layer/model).

**RunManager (extension):**
- Purpose: Owns runs, panels, sessions, scope, border, prompts; central command dispatcher.
- Examples: `src/extension/run-manager.ts`.
- Pattern: Single instance created in `src/extension/index.ts`.

**TabScope (extension):**
- Purpose: Maps tabs to conversations, manages tab groups and panel enablement.
- Examples: `src/extension/bindings.ts`.
- Pattern: Persisted in session storage; hooks for change notifications.

**Journal (extension):**
- Purpose: Sequenced event delivery to panels with replay (`sinceSeq`).
- Examples: `src/extension/journal.ts`.
- Pattern: Per-conversation sequenced events.

**PromptBroker (extension):**
- Purpose: Routes layer prompts (write cards, ask_user, hand-over) to the right panel.
- Examples: `src/extension/prompt-broker.ts`.

**RefRegistry / KnownSet (browser-control):**
- Purpose: One identity for elements; refs fail closed outside their document/epoch.
- Examples: `src/browser-control/core/refs.ts`.

## Entry Points

**Service worker:**
- Location: `entrypoints/background.ts`
- Triggers: Chrome loads extension (MV3 service worker).
- Responsibilities: Synchronous imports of product wiring (`@src/extension`) and test extension (`@src/background`); WXT strips side-effect imports otherwise.

**Side panel page:**
- Location: `entrypoints/sidepanel/index.html` → `src/side-panel/index.tsx`
- Triggers: User opens side panel (Alt+Shift+N) or per-tab enablement.
- Responsibilities: React chat UI, connects via `PanelClient`.

**Options page:**
- Location: `entrypoints/options/index.html` → `src/options/index.tsx`/`App.tsx`
- Triggers: User opens settings.
- Responsibilities: Settings UI.

**Welcome page:**
- Location: `entrypoints/welcome/` → `src/options/welcome-main.tsx`
- Triggers: On install.
- Responsibilities: First-run page, shortcuts.

**Permission page (microphone):**
- Location: `entrypoints/permission/`
- Triggers: Voice input permission flow.

**Offscreen document:**
- Location: `entrypoints/offscreen/main.ts`
- Triggers: Saved file blob URLs.
- Responsibilities: Blob URL hosting for saved files.

**Test panel (developer):**
- Location: `entrypoints/testpanel/index.html` → `src/test-panel/`
- Triggers: `open-test-panel` command (unbound by default).
- Responsibilities: Layer developer UI.

**Layer public entry:**
- Location: `src/browser-control/index.ts`
- Triggers: Imported by extension/background.
- Responsibilities: Exports controller factory and all layer symbols.

**Controller factory:**
- Location: `src/browser-control/index.ts` (`createChromeController`)
- Triggers: `src/extension/layer.ts` (`controllerReady`), background test layer.
- Responsibilities: Wires chrome.debugger/Puppeteer/tabs/storage.

## Architectural Constraints

- **Threading:** Single-threaded service worker event loop; async/await throughout. `TabLocks` serializes per-tab actions. No worker threads.
- **Global state:** Module-level singletons: `runManager` (`src/extension/index.ts`), `controllerReady` promise (`src/extension/layer.ts`), TabScope cache (`src/extension/bindings.ts`), db opening promise (`src/store/db.ts`), connections set in RunManager. Layer state per tab in Controller `#tabs` Map.
- **Circular imports:** None intended; import rules prevent layer/extension cycles. `src/extension/index.ts` imports `@src/store/whats-new`, `@src/ui/whats-new`, `@src/ui/protocol`.
- **Chrome-only APIs:** `chrome.*` globals; agent/llm never touch them directly (enforced by ESLint `no-restricted-globals`).
- **Layer isolation:** `src/browser-control/` imports nothing from outside (enforced); others import layer only via `index.ts`.
- **No external entry points:** Layer is in-process only; future MCP bridge is the only external path.
- **CDP access:** Only via `chrome.debugger`; no WebSocket CDP.
- **Frame management:** Puppeteer only; no parallel registry.
- **Element finding:** Raw CDP by handle; no Puppeteer selectors/ElementHandle.
- **No model in layer:** Deterministic only.

## Anti-Patterns

### Importing layer internals

**What happens:** Importing `src/browser-control/core/...` directly instead of `src/browser-control/index.ts`.
**Why it's wrong:** Bypasses the public API; breaks encapsulation and lint.
**Do this instead:** Import from `@src/browser-control` (`src/browser-control/index.ts`).

### Touching Chrome APIs from agent/llm

**What happens:** Using `chrome.*` in `src/agent/` or `src/llm/`.
**Why it's wrong:** Breaks testability and layering; ESLint errors.
**Do this instead:** Pass interfaces (LayerPort, HostPort) from `src/extension/`.

### UI importing agent/extension

**What happens:** `src/side-panel/` or `src/options/` importing `src/agent/` or `src/extension/`.
**Why it's wrong:** UI must stay a view; breaks separation and lint.
**Do this instead:** Communicate via panel protocol over chrome.runtime Port.

### Element lookup via Puppeteer

**What happens:** Using selectors/ElementHandle clicks in the layer.
**Why it's wrong:** Violates fixed design constraint; refs must be browser handles.
**Do this instead:** Raw CDP commands to the frame session Puppeteer reports.

### Hidden substitution in actions

**What happens:** Layer silently picking a different node/mechanism after dispatch.
**Why it's wrong:** Violates invariant #4 (no hidden substitution); retries must happen before dispatch.
**Do this instead:** Choose by rule before dispatch and name it in the receipt.

## Error Handling

**Strategy:** Typed `LayerError` codes (`src/browser-control/protocol/errors.ts`) converted to `ProtocolError` at boundaries; agent loop catches provider errors and runs overflow recovery; UI shows errors via panel events.

**Patterns:**
- Layer: `LayerError` with code, message, delivered hint; `toProtocolError` at call boundary (`src/browser-control/core/controller.ts`).
- Agent: provider errors surfaced as `LoopEnd` with `cause: 'provider'`/`'context'`/`'cut'`; overflow recovery compacts/shortens then retries.
- Extension: try/catch around async operations, console.error with `[tag]` prefixes; panel errors via `{ type: 'error', message }`.
- Masking: secrets masked in results (`maskSecrets`); page content defused (`defuseQuotes`).

## Cross-Cutting Concerns

**Logging:** `console.info`/`console.error`/`console.warn` with bracketed tags (e.g. `[layer]`, `[runs]`, `[scope]`). No logging framework.

**Validation:** zod schemas for layer tool args (`src/browser-control/protocol/schemas.ts`) and protocol; TypeScript strict mode.

**Authentication:** No auth provider; model API keys stored in `chrome.storage.local` via settings/keys stores. Page-level auth handled by browser.

**Permissions:** Optional Chrome permissions (downloads, tabGroups, notifications) gated by user click; manifest permission lists split product/autorun (`src/ui/manifest-permissions.ts`).

**Internationalization:** Three locales (en, zh_CN, zh_TW) via `src/ui/i18n.ts` and `locales/*.json`; locale files in `public/_locales/`.

**Analytics:** Anonymous daily counts via PostHog (opt-out), no identifier; keys in `.env` (never committed).

---

*Architecture analysis: 2026-10-30*
