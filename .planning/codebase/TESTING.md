---
last_mapped_commit: 19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458
last_mapped_at: 2026-10-30
---
# Testing Patterns

**Analysis Date:** 2026-10-30

## Test Framework

**Runner:**
- Vitest 5.0.5. Config in `vitest.config.mts`: test files matched by `src/**/__tests__/**/*.test.{ts,tsx}`; path alias `@src` → `src`.
- Run with `pnpm test` (`vitest run`).

**Assertion Library:**
- Vitest's built-in `expect` (Jasmine/Jest-style matchers: `toBe`, `toEqual`, `toMatchObject`, `toHaveLength`, `toThrow`).

**Run Commands:**

```bash
pnpm test              # Run all unit tests once
pnpm type-check        # TypeScript (tsc --noEmit)
pnpm lint              # ESLint
pnpm prettier          # Format
```

- There is no watch or coverage script in `package.json`; coverage tooling (`@vitest/coverage-v8` / `istanbul`) is available in the lockfile but not wired up.

## Test File Organization

**Location:**
- Co-located under a `__tests__/` directory next to the code under test: `src/store/__tests__/storage.test.ts`, `src/agent/__tests__/loop.test.ts`.
- Shared test helpers live in a `testing/` directory beside the module: `src/agent/testing/fake-layer.ts`.

**Naming:**
- `<source-name>.test.ts` for TypeScript, `<source-name>.test.tsx` for files that render JSX.
- Describe blocks are named after the subject and use plain lowercase sentence titles: `describe('createStorage', ...)`, `describe('the loop', ...)`.

**Structure:**

```
src/<area>/__tests__/<name>.test.ts(x)
src/<area>/testing/<helper>.ts   # fakes, fixtures shared by that area's tests
```

## Test Structure

**Suite Organization:**

```ts
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

afterEach(async () => {
  await closeDb();
  globalThis.indexedDB = new IDBFactory();
});

describe('conversations', () => {
  it('appends entries as a tree and reads the active branch', async () => {
    const c = await createConversation({ mode: 'ask' });
    ...
    expect((await activeBranch(c.id)).map(e => e.id)).toEqual([a.id, b.id]);
  });
});
```

**Patterns:**
- `describe` groups by module or feature; `it` titles are full sentences describing the behaviour.
- Parameterized cases use `it.each([...])('...', async (args) => ...)`.
- Setup is inlined in each test or in a small local `setup(...)` helper at the top of the file; there is no shared global setup file.
- Teardown resets state: IndexedDB is recreated in `afterEach`; chrome globals are unstubbbed; timers restored with `vi.useRealTimers()`.

## Mocking

**Framework:** Vitest's `vi` (`vi.fn`, `vi.mock`, `vi.stubGlobal`, `vi.spyOn`, `vi.useFakeTimers`).

**Patterns:**
- Chrome APIs are faked by hand as plain objects and installed with `vi.stubGlobal('chrome', { storage: { local: area } })`. A typical fake storage area:
  ```ts
  function fakeChromeStorage() {
    const data: Record<string, unknown> = {};
    const area = {
      get: vi.fn(async (keys: string[]) => Object.fromEntries(keys.filter(k => k in data).map(k => [k, data[k]]))),
      set: vi.fn(async (items) => { Object.assign(data, items); }),
      onChanged: { addListener: (l) => listeners.push(l) },
    };
    return { data, area };
  }
  ```
- Module-level mocking is used sparingly and only for heavy externals, e.g. `vi.mock('puppeteer-core/internal/...')`.
- The agent's layer dependency is replaced by `FakeLayer` (`src/agent/testing/fake-layer.ts`), which records calls and returns prepared `Result` objects via per-tool handlers. `FakeHost` stands in for the `HostPort`.
- React components are tested by rendering to a static string with `renderToStaticMarkup` from `react-dom/server` and asserting on the HTML; there is no `@testing-library`:
  ```ts
  const html = renderToStaticMarkup(<Cards prompts={[p]} answer={() => undefined} />);
  expect(html).toContain('...');
  ```
- Time-based behaviour uses `vi.useFakeTimers()` plus `vi.advanceTimersByTime(...)`, restored in `afterEach`.

**What to Mock:**
- Chrome extension APIs (`chrome.storage`, `chrome.tabs`, `chrome.debugger`, etc.).
- IndexedDB (via `fake-indexeddb/auto` plus a fresh `IDBFactory`).
- The browser control layer, when testing the agent loop (`FakeLayer`).
- Browser globals such as `MediaRecorder`, `navigator.mediaDevices`.

**What NOT to Mock:**
- Pure domain logic and storage helpers are exercised against the real (faked) IndexedDB/Chrome storage rather than mocked.
- Zod schemas and protocol types are tested directly.

## Fixtures and Factories

**Test Data:**
- Small factory helpers are defined locally in each test file, e.g.:
  ```ts
  const row = (tool: string, args: unknown, result?: unknown): ToolRow => ({ toolCallId: 'x', tool, args, status: 'done', result });
  const card = (kind, data): OpenPrompt => ({ id: 'p', kind, conversationId: 'c', tabId: 1, data, openedAt: '' });
  ```
- `ScriptedModel` (`@src/llm`) drives the agent loop's model replies in tests.
- `ok`, `failed`, `receipt` helpers in `src/agent/testing/fake-layer.ts` build `Result` objects.

**Location:**
- Fakes and shared helpers live under `src/<area>/testing/`. Static fixture pages for browser checks live under `fixtures/` (not unit-tested here).
- Some tests read real files from disk with `node:fs` (`readFileSync`) to keep generated lists honest, e.g. `src/options/__tests__/licences.test.ts` reads `package.json`.

## Coverage

**Requirements:** None enforced. No coverage thresholds or scripts are configured; `.gitignore` ignores a `coverage/` directory.

**View Coverage:**
- Not wired up. The Vitest coverage providers are present in the dependency tree; running `vitest run --coverage` would require installing/configuring `@vitest/coverage-v8` or `istanbul`.

## Test Types

**Unit Tests:**
- The bulk of the suite: pure functions, storage, agent loop logic, protocol validation, UI rendering helpers. Fast, no browser.

**Integration Tests:**
- Store-level tests exercise IndexedDB end to end through `fake-indexeddb` (e.g. `conversations.test.ts`).

**E2E Tests:**
- Not in Vitest. Browser-level checks run via `pnpm autorun <check>` against Chrome for Testing and fixture pages; these are scenario scripts under `src/background/scenarios/` and `src/background/checks/`, not part of `pnpm test`.

## Common Patterns

**Async Testing:**

```ts
it('...', async () => {
  await expect(appendEntry('nope', { ... })).rejects.toThrow(/does not exist/);
});
```

**Error Testing:**
- Assert on thrown messages with regex: `rejects.toThrow(/does not exist/)`.
- Assert on result objects: `expect(result.ok).toBe(false)` and `expect(text).toMatch(/USER_STEP/)`.

**Time-based Testing:**

```ts
vi.useFakeTimers();
// ... trigger
vi.advanceTimersByTime(60);
// ... assert
afterEach(() => vi.useRealTimers());
```

**IndexedDB Testing:**

```ts
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
afterEach(async () => {
  await closeDb();
  globalThis.indexedDB = new IDBFactory();
});
```

**Chrome Storage Testing:**
- A fresh fake storage area is created per test (often in `beforeEach`/`afterEach` via `vi.unstubAllGlobals()`), then `vi.stubGlobal('chrome', ...)` installs it.

---

*Testing analysis: 2026-10-30*
