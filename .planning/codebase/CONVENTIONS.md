---
last_mapped_commit: 19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458
last_mapped_at: 2026-10-30
---
# Coding Conventions

**Analysis Date:** 2026-10-30

## Naming Patterns

**Files:**
- Utility and module files use kebab-case: `activity-label.ts`, `analytics-payload.ts`, `cdp-session.ts`, `fake-layer.ts`.
- React component files use PascalCase: `Cards.tsx`, `Composer.tsx`, `RunControls.tsx`.
- Test files mirror their source name with a `.test.ts` or `.test.tsx` suffix and live in a sibling `__tests__/` directory: `src/store/__tests__/storage.test.ts`.
- Entrypoint files are lowercase and named after their role: `entrypoints/background.ts`.

**Functions:**
- camelCase for all functions and methods: `createStorage`, `decideWrite`, `usableModel`, `resolveProfile`.
- Private class members use native `#` private fields and `#`-prefixed private methods: `#runs`, `#stop`, `#scopeChanged`.
- React components are PascalCase function components: `export function Button(...)`, `export function Cards(...)`.

**Variables:**
- camelCase for locals and parameters: `conversationId`, `startedAt`, `maxInFlight`.
- Boolean-ish state often named as adjectives or `is`/`has` predicates: `isRunning`, `isActive`, `loaded`.

**Types:**
- PascalCase for types and interfaces: `Settings`, `ModelProfile`, `PanelState`, `ErrorCode`.
- Type aliases and interfaces are used interchangeably; no TypeScript `enum` keyword anywhere. Finite string sets are modelled as `const` arrays with `as const` plus a derived union type:
  ```ts
  export const ENDS = ['success', 'partial', 'failed', 'stopped', 'capped', 'interrupted'] as const;
  export type End = (typeof ENDS)[number];
  ```
- Constants use UPPER_SNAKE_CASE when they are configuration or limits: `DEFAULT_SETTINGS`, `MAX_FILE`, `ASK_TIMEOUT_MS`, `SHORT_RESULT`. Derived/lookup constants sometimes keep PascalCase when they name a concept: `EMPTY_GUARDS`, `ZERO_USAGE`.

**Zod schemas:**
- Schema constants are PascalCase with a `Schema` suffix: `SnapshotArgsSchema`, `TargetSchema`, `RefTargetSchema`. Inferred types are PascalCase without the suffix: `type SnapshotArgs = z.infer<typeof SnapshotArgsSchema>`.

## Code Style

**Formatting:**
- Prettier (`.prettierrc`): 2-space indent, semicolons, single quotes, trailing commas in all positions, 120-character print width, `arrowParens: 'avoid'`, `bracketSameLine: true`, `htmlWhitespaceSensitivity: 'strict'`.
- Format with `pnpm prettier`; CI checks with `prettier --check`.

**Linting:**
- ESLint 9 flat config (`eslint.config.js`) with `@eslint/js`, `typescript-eslint` recommended, `eslint-plugin-import`, `react`, `react-hooks`, `jsx-a11y`, `tailwindcss`, and `eslint-config-prettier`.
- Key enforced rules:
  - `@typescript-eslint/consistent-type-imports: error` — type-only imports must use `import type`.
  - `@typescript-eslint/no-unused-vars: error` with `caughtErrors: 'none'` and `argsIgnorePattern: '^_'`.
  - `react-hooks/rules-of-hooks: error`, `react-hooks/exhaustive-deps: warn`.
- Run with `pnpm lint`. The config also encodes the repository's import rules (see Import Organization).

**TypeScript:**
- `strict: true`, `noImplicitAny`, `strictNullChecks`, `noImplicitReturns`, `isolatedModules`, `forceConsistentCasingInFileNames`.
- `noUncheckedIndexedAccess: false` and `noImplicitOverride: false` are intentionally relaxed.
- Target ESNext modules; `moduleResolution: 'bundler'`; `verbatimModuleSyntax: false`.
- WXT auto-imports are disabled (`imports: false` in `wxt.config.ts`); every symbol is imported explicitly.

**Comments:**
- File-level comments state the purpose of the module in one or two sentences, often followed by design notes. Inline comments explain why, not what, in plain words.
- Section headers and constraints are written as prose, e.g. `// Settings, provider configurations and API keys in chrome.storage.local.`.
- JSDoc blocks are used for public interfaces and exported functions, with `/** ... */` and inline `/** ... */` for field documentation.
- ESLint disable directives are scoped and justified inline: `// eslint-disable-next-line jsx-a11y/label-has-associated-control`.

**Module structure:**
- One concept per file; small shared components live together (`src/ui/components.tsx`).
- No default exports in `src/` except WXT entrypoint definitions (`export default defineBackground(...)`).
- All exports are named.

## Import Organization

**Order:**
1. Node built-ins when needed (`node:fs`, `node:path`).
2. External packages (`react`, `zod`, `ai`, `vitest`).
3. `@src/...` path-alias imports.
4. Relative imports (`./...`, `../...`).
- Within each group, type-only imports are written with `import type` and are enforced by ESLint.

**Path Aliases:**
- `@src` maps to `src/` (defined in `wxt.config.ts` and `vitest.config.mts`). It is the only alias in application code.

**Import rules (enforced by ESLint `no-restricted-paths` / `no-restricted-imports`):**
- `src/browser-control/` imports nothing from outside itself; everything else reaches the layer only through `src/browser-control/index.ts`.
- `src/llm/` knows nothing about browsers, agents, extension, store or UI.
- `src/agent/` reaches Chrome only through interfaces passed in by `src/extension/`.
- `src/side-panel/`, `src/options/` and `src/ui/` never import `src/agent/`, `src/extension/` or `src/background/`; they talk to the worker through the typed panel protocol in `src/ui/protocol.ts`.
- `src/browser-control/` files may not use the `@src/*` alias except to reach back into `src/browser-control/*`.

## Error Handling

**Strategy:**
- The browser control layer throws `LayerError` (from `src/browser-control/protocol/errors.ts`) with a typed `ErrorCode` (e.g. `REF_UNKNOWN`, `NOT_VISIBLE`, `USER_STEP`). Each code carries a `delivered` flag (whether input reached the page) and a hint for the agent.
- Higher layers use ordinary `Error` subclasses for domain failures, e.g. `ModelUnavailable` in `src/extension/models.ts`.
- Results are returned as `{ ok, text, ... }` objects across the layer boundary rather than thrown; the controller converts `LayerError` into a result.

**Patterns:**
- `try { ... } catch (error) { ... }` blocks around fallible work; caught errors are cast with `as Error` or `as { message }` when reading `.message`.
- Fire-and-forget side effects use `.catch(() => undefined)` or `.catch(error => console.error('[prefix] ...', error))`.
- Swallowed errors are explicit: `void this.border.start().catch(() => undefined);`.
- Validation uses zod schemas (`z.strictObject`, `z.enum`, etc.) at protocol boundaries; `INVALID_ARGUMENT` is the resulting code.
- Aborted runs short-circuit: `if (request.signal?.aborted) return { ..., finish: 'aborted' }`.

## Logging

**Framework:** `console` (no logging library).

**Patterns:**
- Prefixed bracketed tags identify the subsystem: `console.info('[background] service worker started')`, `console.error('[analytics] send failed', error)`, `console.warn('[scope] grouping failed', error)`.
- `console.error` for failures, `console.warn` for recoverable issues, `console.info` for lifecycle events. `console.log` is avoided in production code.
- Secrets and API keys are never logged; the codebase masks password, card number and OTP values wherever page content is returned.

## Comments

**When to Comment:**
- Every module opens with a comment stating its purpose. Non-obvious invariants, ordering constraints and "why not" notes are commented at the point they matter.
- Comments are written in plain words; they describe what the code does and why, not how.

**JSDoc/TSDoc:**
- `/** ... */` blocks document exported interfaces, functions and their fields. Inline `/** ... */` is used for individual members of interfaces and object literals.

## Function Design

**Size:** No hard limit, but functions are kept focused; large orchestration (e.g. `RunManager.handle`) uses private `#` helpers grouped by concern. Pure helpers are extracted into their own modules for testability.

**Parameters:**
- Positional parameters for one or two values; an options object for three or more or for optional flags: `createAgentSession(controller, config)`, `AgentLoop({ ... })`.
- Destructuring in the parameter list is common: `export function Button({ variant = 'secondary', className = '', ...props })`.

**Return Values:**
- Async functions return `Promise<T>`; synchronous pure functions return plain values.
- Early returns are preferred over nested conditionals.
- Discriminated unions and `{ ok, ... }` result objects are used instead of exceptions for expected failures.

## Module Design

**Exports:**
- Named exports only (no default exports in `src/`). Barrel files are used sparingly: `src/browser-control/index.ts` is the sole public entry of the layer; `src/agent/index.ts` and `src/store/index.ts` re-export.
- `export type` / `export interface` for types; `export const` / `export function` for values.

**Barrel Files:**
- Used at package boundaries (`src/browser-control/index.ts`, `src/store/index.ts`, `src/agent/index.ts`) and for protocol re-exports (`src/browser-control/protocol/index.ts`). Internal modules import each other by relative path.

**Class design:**
- Classes use `#` private fields (native private) for all internal state; public state is `readonly` where possible: `readonly journal`, `readonly permissions`.
- Side effects in constructors are limited to wiring (listeners, stores); async setup goes through explicit `async` factory methods such as `Controller.create(...)` and `createChromeController(...)`.

---

*Convention analysis: 2026-10-30*
