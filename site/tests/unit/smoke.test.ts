import { describe, expect, it } from 'vitest';

// Proves the Vitest runner is wired up. Real unit tests arrive in later stages.
describe('vitest smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
