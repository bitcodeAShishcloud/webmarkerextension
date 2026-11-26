<!-- GSD:project-start source:PROJECT.md -->

## Project

**WebMarker Extensions**

WebMarker Extensions is a Chrome/Edge extension that automates the web with a single in-browser AI agent: a deterministic browser-control layer (observe, act, report) sits underneath an agent loop that drives it through the Vercel AI SDK. Users bring their own model provider keys, and the agent works on the tabs they allow, under one of three permission modes. This milestone focuses on letting users add and run their own OpenAI-compatible models (custom base URL, key, model id, max output tokens, context window) instead of only the built-in providers.

**Core Value:** The agent must run correctly on a model the user configures themselves — tool calls work, and the context and output limits the user states are respected — so WebMarker Extensions is not locked to a fixed provider list.

### Constraints

- **Tech stack**: TypeScript 6, React 18, WXT, Vercel AI SDK, Chrome MV3 — no new dependencies
- **Reuse**: build on the existing `openai-compatible` provider kind and `ModelEntry.overrides`; do not add a new provider kind
- **Compatibility**: Chrome and Edge only
- **Security**: API keys never logged, exported or sent anywhere but their provider; mask values in page content
- **Import rules**: layer untouched; `src/llm` stays browser-agnostic; UI never imports agent/extension

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 6.0.3 - All extension and layer source under `src/`, `entrypoints/`, `wxt.config.ts`, `tsconfig.json`, `vitest.config.mts`, `tailwind.config.ts`
- JavaScript (ES modules, Node 24) - Build/dev scripts and fixture server: `fixtures/server.mjs`, `fixtures/autorun.mjs`, `fixtures/chrome.mjs`, `scan2.mjs`
- HTML/CSS - Entrypoint HTML shells under `entrypoints/*/index.html`, Tailwind utility classes
- JSON - i18n catalogues `src/ui/locales/{en,zh_CN,zh_TW}.json`, manifest locale strings under `public/_locales/`

## Runtime

- Chrome Extension (Manifest V3) - Minimum Chrome version 125 (`wxt.config.ts` `manifest.minimum_chrome_version`)
- Node.js >= 24.22.1 (engines in `package.json`); CI uses Node 24 with `check-latest`
- Chrome for Testing (headless, plain process, `--use-mock-keychain`) for `pnpm autorun` browser checks
- pnpm 10.34.7 (pinned via `packageManager` in `package.json`)
- Lockfile: `pnpm-lock.yaml` present (CI runs `pnpm install --frozen-lockfile`)

## Frameworks

- WXT 0.21.4 - Chrome extension build framework (`wxt.config.ts`, `web-ext.config.ts`)
- React 18.3.1 - UI for side panel, options, welcome, permission, test panel (`src/side-panel/`, `src/options/`, `src/test-panel/`)
- Vercel AI SDK `ai` 7.0.150 - Model calls, streaming, tool calling, transcription (`src/llm/`)
- `@ai-sdk/anthropic` 4.0.87
- `@ai-sdk/google` 4.0.104
- `@ai-sdk/openai` 4.0.101
- Vitest 5.0.5 - Unit tests (`src/**/__tests__/**/*.test.{ts,tsx}`)
- `fake-indexeddb` 6.2.6 - IndexedDB in tests
- Vite 8.3.5 (via WXT) - Bundling
- TypeScript 6.0.3 - Type checking (`pnpm type-check`)
- Tailwind CSS 3.4.17 - Styling (`tailwind.config.ts`)
- PostCSS 8.5.31 + Autoprefixer 10.6.1 - CSS processing
- ESLint 9.39.5 - Linting (`eslint.config.js`)
- Prettier 3.9.10 - Formatting (`.prettierrc`, printWidth 120, 2 spaces, single quotes, semicolons)

## Key Dependencies

- `ai` 7.0.150 - Language model abstraction, streaming, tool calls, transcription
- `puppeteer-core` ^25.16.0 - Frame manager over `chrome.debugger` (ExtensionTransport) (`src/browser-control/host/puppeteer.ts`)
- `zod` 4.6.7 - Schema validation for tool args and analytics payloads
- `idb` ^8.0.4 - IndexedDB wrapper (`src/store/db.ts`)
- `@radix-ui/react-dialog` ^1.3.1 - Dialog primitives
- `react-markdown` ^10.1.0 - Markdown rendering
- `rehype-sanitize` ^6.0.0 - Sanitize rendered HTML
- `remark-gfm` ^4.0.1 - GitHub-flavored Markdown
- `@types/chrome` ^0.3.6 - Chrome API types
- `@vitejs/plugin-react-swc` ^4.3.3 - React fast refresh
- `@typescript-eslint/*` 8.72.0 - TS linting
- `eslint-plugin-import` 2.32.0 - Import rules (layer/extension boundaries)
- `eslint-plugin-jsx-a11y` 6.10.2, `eslint-plugin-react` 7.37.5, `eslint-plugin-react-hooks` 7.1.1
- `eslint-plugin-tailwindcss` ^3.18.2
- `rimraf` ^6.1.3 - Clean script

## Configuration

- `.env.example` - Template for `VITE_POSTHOG_API_KEY` and `VITE_POSTHOG_HOST`
- `vite-env.d.ts` - Typed `import.meta.env` (`WXT_AUTORUN_URL`, `VITE_POSTHOG_API_KEY`, `VITE_POSTHOG_HOST`)
- Runtime env (dev/test): `WXT_AUTORUN_URL`, `WXT_PRODUCT_PERMISSIONS`, `FIXTURE_PORT`, `NB_LIVE`, `CHROME_PATH`, provider keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_GENERATIVE_AI_API_KEY`, `OPENROUTER_API_KEY`)
- `.npmrc` - `engine-strict=true`, `minimum-release-age=1920` (supply-chain safety)
- `wxt.config.ts` - WXT/manifest config, alias `@src`, outDir, permissions, Vite plugins (React SWC, Tailwind, autoprefixer), sourcemaps in dev
- `tsconfig.json` - Strict TS, extends `.wxt/tsconfig.json`, JSX react-jsx, lib DOM/ESNext
- `vitest.config.mts` - Test include `src/**/__tests__/**/*.test.{ts,tsx}`, alias `@src`
- `eslint.config.js` - Flat config with import boundary rules
- `.prettierrc` - 2 spaces, semicolons, single quotes, trailing commas, printWidth 120
- `tailwind.config.ts` - Content globs, darkMode class, theme tokens

## Platform Requirements

- Node.js 24 LTS (>= 24.22.1), pnpm 10.34.7
- Chrome or Edge for loading unpacked `dist/`
- Chrome for Testing for `pnpm autorun` (install via `pnpm install-chrome`)
- Chrome/Edge with Manifest V3, minimum Chrome 125
- Extension loaded unpacked from `dist/` or installed from Chrome Web Store

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Utility and module files use kebab-case: `activity-label.ts`, `analytics-payload.ts`, `cdp-session.ts`, `fake-layer.ts`.
- React component files use PascalCase: `Cards.tsx`, `Composer.tsx`, `RunControls.tsx`.
- Test files mirror their source name with a `.test.ts` or `.test.tsx` suffix and live in a sibling `__tests__/` directory: `src/store/__tests__/storage.test.ts`.
- Entrypoint files are lowercase and named after their role: `entrypoints/background.ts`.
- camelCase for all functions and methods: `createStorage`, `decideWrite`, `usableModel`, `resolveProfile`.
- Private class members use native `#` private fields and `#`-prefixed private methods: `#runs`, `#stop`, `#scopeChanged`.
- React components are PascalCase function components: `export function Button(...)`, `export function Cards(...)`.
- camelCase for locals and parameters: `conversationId`, `startedAt`, `maxInFlight`.
- Boolean-ish state often named as adjectives or `is`/`has` predicates: `isRunning`, `isActive`, `loaded`.
- PascalCase for types and interfaces: `Settings`, `ModelProfile`, `PanelState`, `ErrorCode`.
- Type aliases and interfaces are used interchangeably; no TypeScript `enum` keyword anywhere. Finite string sets are modelled as `const` arrays with `as const` plus a derived union type:
- Constants use UPPER_SNAKE_CASE when they are configuration or limits: `DEFAULT_SETTINGS`, `MAX_FILE`, `ASK_TIMEOUT_MS`, `SHORT_RESULT`. Derived/lookup constants sometimes keep PascalCase when they name a concept: `EMPTY_GUARDS`, `ZERO_USAGE`.
- Schema constants are PascalCase with a `Schema` suffix: `SnapshotArgsSchema`, `TargetSchema`, `RefTargetSchema`. Inferred types are PascalCase without the suffix: `type SnapshotArgs = z.infer<typeof SnapshotArgsSchema>`.

## Code Style

- Prettier (`.prettierrc`): 2-space indent, semicolons, single quotes, trailing commas in all positions, 120-character print width, `arrowParens: 'avoid'`, `bracketSameLine: true`, `htmlWhitespaceSensitivity: 'strict'`.
- Format with `pnpm prettier`; CI checks with `prettier --check`.
- ESLint 9 flat config (`eslint.config.js`) with `@eslint/js`, `typescript-eslint` recommended, `eslint-plugin-import`, `react`, `react-hooks`, `jsx-a11y`, `tailwindcss`, and `eslint-config-prettier`.
- Key enforced rules:
- Run with `pnpm lint`. The config also encodes the repository's import rules (see Import Organization).
- `strict: true`, `noImplicitAny`, `strictNullChecks`, `noImplicitReturns`, `isolatedModules`, `forceConsistentCasingInFileNames`.
- `noUncheckedIndexedAccess: false` and `noImplicitOverride: false` are intentionally relaxed.
- Target ESNext modules; `moduleResolution: 'bundler'`; `verbatimModuleSyntax: false`.
- WXT auto-imports are disabled (`imports: false` in `wxt.config.ts`); every symbol is imported explicitly.
- File-level comments state the purpose of the module in one or two sentences, often followed by design notes. Inline comments explain why, not what, in plain words.
- Section headers and constraints are written as prose, e.g. `// Settings, provider configurations and API keys in chrome.storage.local.`.
- JSDoc blocks are used for public interfaces and exported functions, with `/** ... */` and inline `/** ... */` for field documentation.
- ESLint disable directives are scoped and justified inline: `// eslint-disable-next-line jsx-a11y/label-has-associated-control`.
- One concept per file; small shared components live together (`src/ui/components.tsx`).
- No default exports in `src/` except WXT entrypoint definitions (`export default defineBackground(...)`).
- All exports are named.

## Import Organization

- Within each group, type-only imports are written with `import type` and are enforced by ESLint.
- `@src` maps to `src/` (defined in `wxt.config.ts` and `vitest.config.mts`). It is the only alias in application code.
- `src/browser-control/` imports nothing from outside itself; everything else reaches the layer only through `src/browser-control/index.ts`.
- `src/llm/` knows nothing about browsers, agents, extension, store or UI.
- `src/agent/` reaches Chrome only through interfaces passed in by `src/extension/`.
- `src/side-panel/`, `src/options/` and `src/ui/` never import `src/agent/`, `src/extension/` or `src/background/`; they talk to the worker through the typed panel protocol in `src/ui/protocol.ts`.
- `src/browser-control/` files may not use the `@src/*` alias except to reach back into `src/browser-control/*`.

## Error Handling

- The browser control layer throws `LayerError` (from `src/browser-control/protocol/errors.ts`) with a typed `ErrorCode` (e.g. `REF_UNKNOWN`, `NOT_VISIBLE`, `USER_STEP`). Each code carries a `delivered` flag (whether input reached the page) and a hint for the agent.
- Higher layers use ordinary `Error` subclasses for domain failures, e.g. `ModelUnavailable` in `src/extension/models.ts`.
- Results are returned as `{ ok, text, ... }` objects across the layer boundary rather than thrown; the controller converts `LayerError` into a result.
- `try { ... } catch (error) { ... }` blocks around fallible work; caught errors are cast with `as Error` or `as { message }` when reading `.message`.
- Fire-and-forget side effects use `.catch(() => undefined)` or `.catch(error => console.error('[prefix] ...', error))`.
- Swallowed errors are explicit: `void this.border.start().catch(() => undefined);`.
- Validation uses zod schemas (`z.strictObject`, `z.enum`, etc.) at protocol boundaries; `INVALID_ARGUMENT` is the resulting code.
- Aborted runs short-circuit: `if (request.signal?.aborted) return { ..., finish: 'aborted' }`.

## Logging

- Prefixed bracketed tags identify the subsystem: `console.info('[background] service worker started')`, `console.error('[analytics] send failed', error)`, `console.warn('[scope] grouping failed', error)`.
- `console.error` for failures, `console.warn` for recoverable issues, `console.info` for lifecycle events. `console.log` is avoided in production code.
- Secrets and API keys are never logged; the codebase masks password, card number and OTP values wherever page content is returned.

## Comments

- Every module opens with a comment stating its purpose. Non-obvious invariants, ordering constraints and "why not" notes are commented at the point they matter.
- Comments are written in plain words; they describe what the code does and why, not how.
- `/** ... */` blocks document exported interfaces, functions and their fields. Inline `/** ... */` is used for individual members of interfaces and object literals.

## Function Design

- Positional parameters for one or two values; an options object for three or more or for optional flags: `createAgentSession(controller, config)`, `AgentLoop({ ... })`.
- Destructuring in the parameter list is common: `export function Button({ variant = 'secondary', className = '', ...props })`.
- Async functions return `Promise<T>`; synchronous pure functions return plain values.
- Early returns are preferred over nested conditionals.
- Discriminated unions and `{ ok, ... }` result objects are used instead of exceptions for expected failures.

## Module Design

- Named exports only (no default exports in `src/`). Barrel files are used sparingly: `src/browser-control/index.ts` is the sole public entry of the layer; `src/agent/index.ts` and `src/store/index.ts` re-export.
- `export type` / `export interface` for types; `export const` / `export function` for values.
- Used at package boundaries (`src/browser-control/index.ts`, `src/store/index.ts`, `src/agent/index.ts`) and for protocol re-exports (`src/browser-control/protocol/index.ts`). Internal modules import each other by relative path.
- Classes use `#` private fields (native private) for all internal state; public state is `readonly` where possible: `readonly journal`, `readonly permissions`.
- Side effects in constructors are limited to wiring (listeners, stores); async setup goes through explicit `async` factory methods such as `Controller.create(...)` and `createChromeController(...)`.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

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

- The browser control layer is in-process and deterministic; no model inside it.
- The agent reaches Chrome only through interfaces passed in by `src/extension/` (LayerPort/HostPort), so it runs with fakes in tests.
- UI surfaces never import agent/extension/background; they talk to the worker over one typed port protocol (`src/ui/protocol.ts`).
- `src/llm/` is browser-agnostic.
- Import rules are enforced by ESLint (`import/no-restricted-paths`, `no-restricted-imports`).

## Layers

- Purpose: Observe pages, act on them, report outcomes deterministically.
- Location: `src/browser-control/`
- Contains: protocol (schemas, errors, catalogue), core (controller, sessions, refs, frames, perception, interaction, tools, lifecycle), host (Puppeteer, CDP session, chrome.debugger, tabs), probe (in-page code), index (public entry).
- Depends on: nothing outside the folder (enforced).
- Used by: `src/extension/`, `src/background/`, `src/test-panel/` (only via `index.ts`).
- Purpose: Product wiring in the service worker: runs, permissions, tab scope, downloads, notifications, border, prompts.
- Location: `src/extension/`
- Contains: `RunManager`, `TabScope` (`bindings.ts`), `PromptBroker`, `Permissions`, `PageBorder`, `Journal`, models, analytics.
- Depends on: browser-control (`index.ts`), agent, store, llm, ui.
- Used by: side panel/options indirectly via messages; entrypoints.
- Purpose: Loop, hooks, agent tools, prompts, context management, run records.
- Location: `src/agent/`
- Contains: `AgentLoop` (`loop.ts`), context, compaction, elision, completion, guards, records, attachments, display.
- Depends on: browser-control types, llm, store. Reaches Chrome only via ports.
- Used by: `src/extension/run-manager.ts`.
- Purpose: Providers, model profiles, streaming, usage accounting, overflow detection, transcription.
- Location: `src/llm/`
- Contains: `providers.ts`, `catalogue.ts`, `profiles.ts`, `stream.ts`, `connection.ts`, `limiter.ts`, `overflow.ts`, `errors.ts`, `model-info.ts`, `scripted.ts`, `transcribe.ts`.
- Depends on: ai SDK, zod. Knows nothing about browsers.
- Used by: extension, agent (via extension).
- Purpose: IndexedDB schema and stores, settings, keys, conversations, blobs, shortcuts, legacy migration, analytics, rating, whats-new.
- Location: `src/store/`
- Contains: `db.ts` (idb, version 1), `conversations.ts`, `settings.ts`, `storage.ts`, `attachments.ts`, `shortcuts.ts`, `legacy.ts`, `analytics.ts`, `rating.ts`, `whats-new.ts`, `types.ts`.
- Depends on: idb.
- Used by: extension, agent, ui (types).
- Purpose: Shared components, theme, i18n runtime and catalogues, panel protocol types.
- Location: `src/ui/`
- Contains: `protocol.ts`, `i18n.ts`, `language.tsx`, `theme.ts`, `components.tsx`, `icons.tsx`, `hooks.ts`, `shortcuts.tsx`, `mode-menu.tsx`, `auto-notice.tsx`, `optional-permissions.ts`, `manifest-permissions.ts`, `whats-new.ts`, `voice.ts`, `links.ts`, locales (`en.json`, `zh_CN.json`, `zh_TW.json`).
- Depends on: React. Never imports agent/extension/background.
- Used by: side-panel, options, test-panel.
- Purpose: Chat UI and settings UI; communicate with worker via panel protocol.
- Location: `src/side-panel/`, `src/options/`.
- Depends on: ui, store (read-only via messages). Never imports agent/extension.
- Purpose: Layer's test harness in the worker: hosts layer, relays test panel, runs checks and scenarios, autorun.
- Location: `src/background/`.
- Depends on: browser-control, ui.
- Used by: `entrypoints/background.ts` (dev/autorun builds).
- Purpose: Chrome-specific adapters: `chrome.debugger`, Puppeteer frame topology, `chrome.tabs`, `chrome.storage`.
- Location: `src/browser-control/host/`.
- Depends on: Chrome APIs, puppeteer-core.

## Data Flow

### Primary Request Path (user message → agent run)

### Secondary Flow: Tab scoping / sharing

### Secondary Flow: Hand-over (user step)

### State Management

- Conversation/entry/run state: IndexedDB via `src/store/db.ts` (idb), accessed through `src/store/conversations.ts`.
- Tab scope: `chrome.storage.session` (`src/extension/bindings.ts`).
- Settings/keys: `chrome.storage.local` (`src/store/settings.ts`).
- Layer state: in-memory per tab in Controller; invalidated on navigation/detach/restart (epoch-based refs).
- Run state survives worker restarts via `RunRecord` in IndexedDB and `restore()`.

## Key Abstractions

- Purpose: Owns tabs, refs, attachments, tool dispatch; sessions hold tab sets and policies.
- Examples: `src/browser-control/core/controller.ts` (`Controller`, `Session`).
- Pattern: One controller per Chrome; many sessions; refs scoped by epoch + document.
- Purpose: Small interfaces decoupling agent from Chrome and UI.
- Examples: `src/agent/ports.ts`.
- Pattern: Dependency injection for testability (fake layer/model).
- Purpose: Owns runs, panels, sessions, scope, border, prompts; central command dispatcher.
- Examples: `src/extension/run-manager.ts`.
- Pattern: Single instance created in `src/extension/index.ts`.
- Purpose: Maps tabs to conversations, manages tab groups and panel enablement.
- Examples: `src/extension/bindings.ts`.
- Pattern: Persisted in session storage; hooks for change notifications.
- Purpose: Sequenced event delivery to panels with replay (`sinceSeq`).
- Examples: `src/extension/journal.ts`.
- Pattern: Per-conversation sequenced events.
- Purpose: Routes layer prompts (write cards, ask_user, hand-over) to the right panel.
- Examples: `src/extension/prompt-broker.ts`.
- Purpose: One identity for elements; refs fail closed outside their document/epoch.
- Examples: `src/browser-control/core/refs.ts`.

## Entry Points

- Location: `entrypoints/background.ts`
- Triggers: Chrome loads extension (MV3 service worker).
- Responsibilities: Synchronous imports of product wiring (`@src/extension`) and test extension (`@src/background`); WXT strips side-effect imports otherwise.
- Location: `entrypoints/sidepanel/index.html` → `src/side-panel/index.tsx`
- Triggers: User opens side panel (Alt+Shift+N) or per-tab enablement.
- Responsibilities: React chat UI, connects via `PanelClient`.
- Location: `entrypoints/options/index.html` → `src/options/index.tsx`/`App.tsx`
- Triggers: User opens settings.
- Responsibilities: Settings UI.
- Location: `entrypoints/welcome/` → `src/options/welcome-main.tsx`
- Triggers: On install.
- Responsibilities: First-run page, shortcuts.
- Location: `entrypoints/permission/`
- Triggers: Voice input permission flow.
- Location: `entrypoints/offscreen/main.ts`
- Triggers: Saved file blob URLs.
- Responsibilities: Blob URL hosting for saved files.
- Location: `entrypoints/testpanel/index.html` → `src/test-panel/`
- Triggers: `open-test-panel` command (unbound by default).
- Responsibilities: Layer developer UI.
- Location: `src/browser-control/index.ts`
- Triggers: Imported by extension/background.
- Responsibilities: Exports controller factory and all layer symbols.
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

### Touching Chrome APIs from agent/llm

### UI importing agent/extension

### Element lookup via Puppeteer

### Hidden substitution in actions

## Error Handling

- Layer: `LayerError` with code, message, delivered hint; `toProtocolError` at call boundary (`src/browser-control/core/controller.ts`).
- Agent: provider errors surfaced as `LoopEnd` with `cause: 'provider'`/`'context'`/`'cut'`; overflow recovery compacts/shortens then retries.
- Extension: try/catch around async operations, console.error with `[tag]` prefixes; panel errors via `{ type: 'error', message }`.
- Masking: secrets masked in results (`maskSecrets`); page content defused (`defuseQuotes`).

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
