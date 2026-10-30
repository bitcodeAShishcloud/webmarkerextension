import { describe, expect, it } from 'vitest';
import { toolsForRun } from '../tools';
import { resolveProfile } from '../../llm/profiles';

describe('toolsForRun screenshot gating', () => {
  it('includes screenshot only when vision is strictly true', () => {
    const withVision = resolveProfile({ kind: 'ollama', modelName: 'qwen3:8b', overrides: { vision: true } });
    const withoutVision = resolveProfile({ kind: 'ollama', modelName: 'qwen3:8b', overrides: { vision: false } });

    expect(withVision.vision).toBe(true);
    expect(withoutVision.vision).toBe(false);

    const namesFor = (vision: boolean) => toolsForRun({ vision }).map(t => t.name);

    expect(namesFor(withVision.vision)).toContain('screenshot');
    expect(namesFor(withoutVision.vision)).not.toContain('screenshot');

    // A truthy but non-true value must not enable screenshots.
    expect(toolsForRun({ vision: 1 as unknown as boolean }).map(t => t.name)).not.toContain('screenshot');
  });
});