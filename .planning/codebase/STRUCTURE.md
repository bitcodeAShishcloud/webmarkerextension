---
last_mapped_commit: 19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458
last_mapped_at: 2026-10-30
---
# Codebase Structure

**Analysis Date:** 2026-10-30

## Directory Layout

```
webmarker-extensions/
├── entrypoints/            # Thin WXT entrypoints (HTML + bootstrap)
│   ├── background.ts
│   ├── sidepanel/
│   ├── options/
│   ├── welcome/
│   ├── permission/
│   ├── offscreen/
│   └── testpanel/
├── src/
│   ├── browser-control/    # The deterministic browser control layer
│   │   ├── protocol/       # Request/result types, zod schemas, errors, catalogue
│   │   ├── core/           # Controller, sessions, refs, frames, perception, interaction, tools
│   │   │   ├── perception/
│   │   │   ├── interaction/
│   │   │   └── tools/
│   │   ├── host/           # Puppeteer, CDP session, chrome.debugger, tabs
│   │   ├── probe/          # In-page code (built to string constant)
│   │   └── index.ts        # Only public entry
│   ├── agent/              # Loop, hooks, agent tools, prompts, context, records
│   │   └── testing/        # Fake layer/scripts for tests
│   ├── llm/                # Providers, profiles, streaming, usage, overflow
│   ├── store/              # IndexedDB schema/stores, settings, keys
│   ├── extension/          # Worker wiring: RunManager, PromptBroker, permissions, scope, downloads, notifications
│   ├── ui/                 # Shared components, theme, i18n, protocol types, locales
│   ├── side-panel/         # Chat UI
│   ├── options/            # Settings UI
│   ├── background/         # Test extension: checks, scenarios, test panel messages, autorun
│   │   ├── checks/
│   │   └── scenarios/
│   └── test-panel/         # Layer test panel (React)
│       └── tabs/
├── fixtures/               # Static test pages, fixture server, autorun, Chrome launcher
│   ├── pages/
│   ├── upgrade/
│   └── server.mjs
├── public/                 # Static assets, _locales, brand
├── .planning/              # GSD planning artifacts
├── wxt.config.ts
├── vitest.config.mts
├── tsconfig.json
├── eslint.config.js
├── tailwind.config.ts
├── package.json
└── AGENTS.md / CLAUDE.md
```

## Directory Purposes

**`entrypoints/`:**
- Purpose: Thin WXT entrypoints; each folder is a build target.
- Contains: HTML shells and minimal bootstrap (`index.tsx`/`main.ts`).
- Key files: `background.ts` (service worker), `sidepanel/index.html`, `options/index.html`, `welcome/index.html`, `permission/index.html`, `offscreen/index.html`+`main.ts`, `testpanel/index.html`.

**`src/browser-control/`:**
- Purpose: The deterministic layer. Self-contained; no imports from outside.
- Contains: `protocol/`, `core/`, `host/`, `probe/`, `index.ts`.
- Key files: `core/controller.ts` (Controller/Session), `core/tools/*`, `core/perception/*`, `core/interaction/*`, `host/connection.ts`, `host/chrome-host.ts`, `host/puppeteer.ts`, `probe/source.ts`, `protocol/catalogue.ts`.

**`src/agent/`:**
- Purpose: Agent loop and supporting logic.
- Contains: `loop.ts`, `context.ts`, `compaction.ts`, `elision.ts`, `completion.ts`, `guards.ts`, `records.ts`, `run.ts`, `prompt.ts`, `tools.ts`, `attachments.ts`, `display.ts`, `header.ts`, `export.ts`, `restore.ts`, `save-file.ts`, `ports.ts`, `index.ts` (empty barrel), `testing/`.

**`src/llm/`:**
- Purpose: Model providers and helpers.
- Contains: `providers.ts`, `catalogue.ts`, `profiles.ts`, `stream.ts`, `connection.ts`, `limiter.ts`, `overflow.ts`, `errors.ts`, `model-info.ts`, `scripted.ts`, `transcribe.ts`, `index.ts`.

**`src/store/`:**
- Purpose: Persistence.
- Contains: `db.ts`, `types.ts`, `conversations.ts`, `settings.ts`, `storage.ts`, `attachments.ts`, `shortcuts.ts`, `legacy.ts`, `analytics.ts`, `rating.ts`, `whats-new.ts`, `index.ts`.

**`src/extension/`:**
- Purpose: Product wiring in the worker.
- Contains: `index.ts`, `run-manager.ts`, `agent-session.ts`, `bindings.ts`, `permissions.ts`, `prompt-broker.ts`, `panel.ts`, `panel-port.ts`, `border.ts`, `journal.ts`, `models.ts`, `downloads.ts`, `thumbnail.ts`, `notify.ts`, `selection.ts`, `layer.ts`, `first-run.ts`, `upgrade.ts`, `uninstall.ts`, `analytics.ts`, `analytics-payload.ts`.

**`src/ui/`:**
- Purpose: Shared UI primitives and protocol.
- Contains: `protocol.ts`, `i18n.ts`, `language.tsx`, `theme.ts`, `components.tsx`, `icons.tsx`, `hooks.ts`, `shortcuts.tsx`, `mode-menu.tsx`, `auto-notice.tsx`, `optional-permissions.ts`, `manifest-permissions.ts`, `whats-new.ts`, `voice.ts`, `links.ts`, `index.css`, `locales/*.json`.

**`src/side-panel/`:**
- Purpose: Chat UI.
- Contains: `App.tsx`, `index.tsx`, `client.ts`, `state.ts`, `Transcript.tsx`, `Composer.tsx`, `Activity.tsx`, `Cards.tsx`, `History.tsx`, `TabBar.tsx`, `RunControls.tsx`, `ModelMenu.tsx`, `Markdown.tsx`, `RatingCard.tsx`, `NoticeCard.tsx`, `WhatsNewCard.tsx`, `message-time.ts`, `activity-label.ts`, `mic-permission.tsx`, `test-hook.ts`.

**`src/options/`:**
- Purpose: Settings UI.
- Contains: `App.tsx`, `index.tsx`, `welcome-main.tsx`, `Welcome.tsx`, `GeneralSection.tsx`, `ProvidersSection.tsx`, `PermissionsSection.tsx`, `ShortcutsSection.tsx`, `DataSection.tsx`, `AboutSection.tsx`, `MemorySection.tsx`, `SettingsCard.tsx`, `BrowserFeaturesCard.tsx`, `MicrophoneCard.tsx`, `PrivacyCard.tsx`, `VoiceCard.tsx`, `licences.ts`, `model-test.ts`.

**`src/background/`:**
- Purpose: Test extension (developer).
- Contains: `index.ts`, `layer.ts`, `tabs.ts`, `panel-port.ts`, `prompts.ts`, `rpc.ts`, `messages.ts`, `autorun.ts`, `fixtures-config.ts`, `spike-session.ts`, `checks/`, `scenarios/`.

**`src/test-panel/`:**
- Purpose: Layer test panel (React).
- Contains: `App.tsx`, `index.tsx`, `index.css`, `components.tsx`, `rpc.ts`, `tabs/*`.

**`fixtures/`:**
- Purpose: Test pages and tooling.
- Contains: `pages/`, `upgrade/`, `server.mjs`, `autorun.mjs`, `chrome.mjs`.

**`public/`:**
- Purpose: Static assets, i18n messages, brand.
- Contains: `icon-32.png`, `icon-128.png`, `_locales/{en,zh_CN,zh_TW}/messages.json`, `brand/`.

## Key File Locations

**Entry Points:**
- `entrypoints/background.ts`: service worker bootstrap.
- `src/side-panel/index.tsx`: side panel React root.
- `src/options/index.tsx`: options React root.
- `src/options/welcome-main.tsx`: welcome page root.
- `src/test-panel/index.tsx`: test panel root.
- `src/browser-control/index.ts`: layer public entry.

**Configuration:**
- `wxt.config.ts`: WXT/build/manifest/aliases.
- `tsconfig.json`: TypeScript config (extends .wxt).
- `eslint.config.js`: lint + import rules.
- `tailwind.config.ts`: Tailwind.
- `vitest.config.mts`: Vitest.
- `package.json`: scripts/deps.

**Core Logic:**
- `src/browser-control/core/controller.ts`: Controller/Session.
- `src/agent/loop.ts`: AgentLoop.
- `src/extension/run-manager.ts`: RunManager.
- `src/extension/bindings.ts`: TabScope.
- `src/store/db.ts`: IndexedDB.
- `src/llm/providers.ts`, `catalogue.ts`, `profiles.ts`: LLM.

**Testing:**
- `src/**/__tests__/`: unit tests co-located.
- `src/background/checks/`: automated checks.
- `src/background/scenarios/`: scenario sets.
- `fixtures/pages/`: fixture pages.
- `src/browser-control/core/__tests__/payloads/`: recorded CDP payloads.

## Naming Conventions

**Files:**
- Source: kebab-case or camelCase `.ts`/`.tsx` (e.g. `run-manager.ts`, `agent-session.ts`, `manifest-permissions.ts`).
- Tests: `*.test.ts`/`*.test.tsx` under `__tests__/`.
- Components: PascalCase `.tsx` (e.g. `App.tsx`, `Cards.tsx`).
- Config: `*.config.*`, `*.mts`.

**Directories:**
- kebab-case folders (`browser-control`, `side-panel`, `test-panel`).
- Feature subfolders lowercase (`perception`, `interaction`, `tools`).
- `__tests__/` for tests, `payloads/` for fixtures.

**Code symbols:**
- Classes PascalCase (`RunManager`, `AgentLoop`, `Controller`, `TabScope`).
- Functions/variables camelCase.
- Constants UPPER_SNAKE for exported constants (`RESULT_CAP`, `CONTEXT_LIMIT`).
- Private fields `#name` (native private).
- Types/interfaces PascalCase.

**Imports:**
- Alias `@src/` → `src/`.
- `import type` for type-only imports (enforced).

## Where to Add New Code

**New layer tool:**
- Handler: `src/browser-control/core/tools/<name>.ts` and register in `core/tools/index.ts`.
- Schema: `src/browser-control/protocol/schemas.ts` and catalogue entry in `protocol/catalogue.ts`.
- Tests: `src/browser-control/core/__tests__/`.

**New agent tool:**
- Definition: `src/agent/tools.ts`.
- Handler wiring: `src/extension/run-manager.ts` (`#agentTool`) if agent-side (e.g. save_file).

**New feature in product:**
- Worker logic: `src/extension/`.
- UI: `src/side-panel/` or `src/options/`.
- Panel protocol additions: `src/ui/protocol.ts` + RunManager handler.
- Store changes: `src/store/` (bump `DB_VERSION` in `db.ts` and migration).

**New UI component shared:**
- `src/ui/components.tsx` or new file in `src/ui/`.

**New check/scenario:**
- `src/background/checks/` or `src/background/scenarios/`, register in `checks/registry.ts` / `scenarios/registry.ts`.

**New fixture page:**
- `fixtures/pages/`.

**New locale string:**
- `src/ui/locales/{en,zh_CN,zh_TW}.json` and `public/_locales/`.

## Special Directories

**`dist/`, `.wxt/`, `.output/`:**
- Purpose: Build output.
- Generated: Yes.
- Committed: No.

**`fixtures/.results/`:**
- Purpose: Autorun results.
- Generated: Yes.
- Committed: No.

**`node_modules/`:**
- Purpose: Dependencies.
- Generated: Yes.
- Committed: No.

**`src/**/__tests__/`:**
- Purpose: Co-located unit tests.
- Generated: No.
- Committed: Yes.

**`src/browser-control/core/__tests__/payloads/`:**
- Purpose: Recorded CDP payloads for pure-function tests.
- Generated: No (hand-recorded).
- Committed: Yes.

**`.planning/`:**
- Purpose: GSD planning artifacts (codebase maps, phases).
- Generated: By tooling.
- Committed: Yes (project planning).

---

*Structure analysis: 2026-10-30*
