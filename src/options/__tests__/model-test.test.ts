// saveTest must keep a model's overrides when merging a test patch.
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { closeDb, db } from '@src/store/db';
import { providersStorage, type ProviderConfig } from '@src/store/settings';
import { saveTest } from '../model-test';

function fakeChrome(local: Record<string, unknown> = {}) {
  const area = (data: Record<string, unknown>) => ({
    get: vi.fn(async (keys: string | string[]) => {
      const list = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(list.filter(k => k in data).map(k => [k, data[k]]));
    }),
    set: vi.fn(async (items: Record<string, unknown>) => void Object.assign(data, items)),
    remove: vi.fn(async (key: string) => void delete data[key]),
    onChanged: { addListener: () => undefined },
  });
  const session: Record<string, unknown> = {};
  vi.stubGlobal('chrome', { storage: { local: area(local), session: area(session) } });
  return { local, session };
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(async () => {
  await closeDb();
  globalThis.indexedDB = new IDBFactory();
});

describe('saveTest keeps overrides (D-03)', () => {
  it('API-only test keeps overrides', async () => {
    const local: Record<string, unknown> = {};
    fakeChrome(local);
    const provider: ProviderConfig = {
      id: 'p',
      kind: 'openai-compatible',
      name: 'P',
      baseUrl: 'http://a/v1',
      models: [{ name: 'm', overrides: { contextWindow: 1000, maxOutput: 500, vision: true } }],
    };
    await providersStorage.set([provider]);
    await saveTest('p', 'http://a/v1', 'm', { patch: { fromApi: { contextWindow: 2000, at: '...' } as never } });
    const stored = await providersStorage.get();
    expect(stored[0].models[0].overrides).toEqual({ contextWindow: 1000, maxOutput: 500, vision: true });
    expect(stored[0].models[0].fromApi?.contextWindow).toBe(2000);
  });

  it('whole test (result truthy) keeps overrides', async () => {
    const local: Record<string, unknown> = {};
    fakeChrome(local);
    const provider: ProviderConfig = {
      id: 'p',
      kind: 'openai-compatible',
      name: 'P',
      baseUrl: 'http://a/v1',
      models: [{ name: 'm', overrides: { contextWindow: 1000, maxOutput: 500, vision: true } }],
    };
    await providersStorage.set([provider]);
    await saveTest('p', 'http://a/v1', 'm', {
      result: { ok: true, toolCalling: true, tested: { reasons: true, at: 'x' } } as never,
      patch: { fromApi: { contextWindow: 2000, at: '...' } as never, noToolCalling: false },
    });
    const stored = await providersStorage.get();
    expect(stored[0].models[0].overrides).toEqual({ contextWindow: 1000, maxOutput: 500, vision: true });
  });
});
