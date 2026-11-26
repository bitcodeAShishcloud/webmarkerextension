import { describe, expect, it } from 'vitest';
import { requestOutputLimit, resolveProfile } from '../profiles';

describe('model profiles', () => {
  it('reads the catalogue, also behind a vendor prefix', () => {
    expect(resolveProfile({ kind: 'anthropic', modelName: 'claude-sonnet-5-5' }).contextWindow).toBe(1_000_000);
    expect(resolveProfile({ kind: 'openrouter', modelName: 'anthropic/claude-sonnet-5-5' }).vision).toBe(true);
    expect(resolveProfile({ kind: 'ollama', modelName: 'qwen3:8b' }).contextWindow).toBe(32_768);
  });

  it('falls back to a cautious default', () => {
    expect(resolveProfile({ kind: 'ollama', modelName: 'mystery' }).contextWindow).toBe(16_384);
    expect(resolveProfile({ kind: 'openai', modelName: 'mystery' }).contextWindow).toBe(128_000);
  });

  it('applies the user overrides, and detection only lowers the window', () => {
    const base = { kind: 'ollama' as const, modelName: 'qwen3:8b' };
    expect(resolveProfile({ ...base, overrides: { contextWindow: 65_536, vision: true } })).toMatchObject({
      contextWindow: 65_536,
      vision: true,
    });
    expect(resolveProfile({ ...base, overrides: { contextWindow: 65_536 }, detectedContext: 8192 }).contextWindow).toBe(
      8192,
    );
    expect(resolveProfile({ ...base, overrides: { contextWindow: 4096 }, detectedContext: 8192 }).contextWindow).toBe(
      4096,
    );
  });

  it('clamps an inflated override context window to the server fact (D-01)', () => {
    const base = { kind: 'ollama' as const, modelName: 'qwen3:8b' };
    // override above the server fact clamps down
    expect(
      resolveProfile({ ...base, overrides: { contextWindow: 100000 }, fromApi: { contextWindow: 32768, at: 'x' } })
        .contextWindow,
    ).toBe(32768);
    // override only (no fromApi) keeps the override
    expect(resolveProfile({ ...base, overrides: { contextWindow: 100000 } }).contextWindow).toBe(100000);
    // detectedContext still lowers even after clamping
    expect(
      resolveProfile({
        ...base,
        overrides: { contextWindow: 100000 },
        fromApi: { contextWindow: 32768, at: 'x' },
        detectedContext: 8192,
      }).contextWindow,
    ).toBe(8192);
  });

  it('requestOutputLimit honors a small user cap (D-02)', () => {
    const p = resolveProfile({ kind: 'ollama', modelName: 'x', overrides: { contextWindow: 8192, maxOutput: 512 } });
    expect(requestOutputLimit(p)).toBeLessThanOrEqual(512);
    // 1024 floor never exceeds the user cap
    const p2 = resolveProfile({ kind: 'ollama', modelName: 'x', overrides: { contextWindow: 8192, maxOutput: 512 } });
    expect(requestOutputLimit(p2)).toBe(512);
  });

  it('caps the output limit of a request to a quarter of the window', () => {
    expect(
      requestOutputLimit(resolveProfile({ kind: 'ollama', modelName: 'x', overrides: { contextWindow: 8192 } })),
    ).toBe(2048);
    expect(requestOutputLimit(resolveProfile({ kind: 'anthropic', modelName: 'claude-sonnet-5-5' }))).toBe(16_384);
  });
});
