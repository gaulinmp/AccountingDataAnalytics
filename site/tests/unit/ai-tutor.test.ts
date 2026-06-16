import { describe, expect, it } from 'vitest';
import { chromeVersion, detectTier, MIN_CHROME, type TierEnv } from '../../packages/ai-tutor/tiers';
import {
  UNIVERSAL_PROMPT,
  getSystemPrompt,
  serializeContext,
  buildCopyPastePrompt,
} from '../../packages/ai-tutor/prompt';
import type { TutorContext } from '../../packages/ai-tutor/types';

const base: TierEnv = {
  hasLanguageModel: false,
  availability: null,
  userAgent: '',
  modeOverride: null,
};
const CHROME_UA = `Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${MIN_CHROME + 2}.0.0.0 Safari/537.36`;
const OLD_CHROME_UA = `Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/${MIN_CHROME - 10}.0.0.0 Safari/537.36`;
const SAFARI_UA = 'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const EDGE_UA = `Mozilla/5.0 (Windows) AppleWebKit/537.36 Chrome/${MIN_CHROME + 2}.0.0.0 Safari/537.36 Edg/${MIN_CHROME + 2}.0.0.0`;

describe('chromeVersion', () => {
  it('parses desktop Chrome', () => {
    expect(chromeVersion(CHROME_UA)).toBe(MIN_CHROME + 2);
  });
  it('rejects Edge, Safari, and mobile (Chromium ≠ Chrome here)', () => {
    expect(chromeVersion(EDGE_UA)).toBeNull();
    expect(chromeVersion(SAFARI_UA)).toBeNull();
    expect(chromeVersion(`${CHROME_UA} Mobile`)).toBeNull();
  });
});

describe('detectTier', () => {
  it('honors ?ai-mode overrides', () => {
    expect(detectTier({ ...base, modeOverride: 'copy-paste' })).toBe('OTHER_BROWSER');
    expect(detectTier({ ...base, modeOverride: 'outdated-chrome' })).toBe('CHROME_OUTDATED');
    expect(detectTier({ ...base, modeOverride: 'on-device' })).toBe('ON_DEVICE');
  });
  it('ON_DEVICE when LanguageModel is present and available', () => {
    expect(
      detectTier({ ...base, userAgent: CHROME_UA, hasLanguageModel: true, availability: 'available' })
    ).toBe('ON_DEVICE');
    expect(
      detectTier({ ...base, userAgent: CHROME_UA, hasLanguageModel: true, availability: 'downloadable' })
    ).toBe('ON_DEVICE');
  });
  it('CHROME_OUTDATED for old Chrome without the API', () => {
    expect(detectTier({ ...base, userAgent: OLD_CHROME_UA })).toBe('CHROME_OUTDATED');
  });
  it('OTHER_BROWSER for Safari, Edge, and current Chrome without the API', () => {
    expect(detectTier({ ...base, userAgent: SAFARI_UA })).toBe('OTHER_BROWSER');
    expect(detectTier({ ...base, userAgent: EDGE_UA })).toBe('OTHER_BROWSER');
    expect(detectTier({ ...base, userAgent: CHROME_UA })).toBe('OTHER_BROWSER');
  });
  it('unavailable LanguageModel is not ON_DEVICE', () => {
    expect(
      detectTier({ ...base, userAgent: CHROME_UA, hasLanguageModel: true, availability: 'unavailable' })
    ).toBe('OTHER_BROWSER');
  });
});

const ctx: TutorContext = {
  scopeKey: 'deck:d:slide:2',
  deck: 'Data Sources',
  slideNumber: 2,
  totalSlides: 3,
  slideTitle: 'Three places data lives',
  selfCheckQuestion: 'Which source is queried with SQL?',
  selfCheckOptions: ['A flat CSV', 'A relational database', 'A PDF'],
  canonicalSelfCheckAnswer: 'A relational database',
  selfCheckExplanation: 'Relational databases are queried with SQL JOINs.',
  aiPrompt: 'Favor JOIN intuition over syntax.',
};

describe('system prompt (the seven rules)', () => {
  it('encodes all seven non-negotiable rules', () => {
    for (let n = 1; n <= 7; n++) expect(UNIVERSAL_PROMPT).toContain(`${n}.`);
    expect(UNIVERSAL_PROMPT).toMatch(/never reveal the canonical answer verbatim/i);
    expect(UNIVERSAL_PROMPT).toMatch(/no help before an attempt/i);
    expect(UNIVERSAL_PROMPT).toMatch(/verify-loop/i);
  });
  it('appends the per-deck addendum', () => {
    expect(getSystemPrompt(ctx)).toContain('Favor JOIN intuition');
    expect(getSystemPrompt({})).toBe(UNIVERSAL_PROMPT);
  });
});

describe('context serialization (Rule 1: canonical is hint-only)', () => {
  it('labels the canonical answer HINT-ONLY, never as the answer', () => {
    const block = serializeContext(ctx);
    expect(block).toContain('HINT-ONLY');
    // the canonical value appears only on the HINT-ONLY line
    const line = block.split('\n').find((l) => l.includes('A relational database') && l.includes('Canonical'));
    expect(line).toMatch(/HINT-ONLY/);
  });
  it('includes the slide locus', () => {
    expect(serializeContext(ctx)).toContain('Slide 2 of 3: Three places data lives');
  });
});

describe('copy-paste prompt', () => {
  it('bundles system + context + conversation + the new question', () => {
    const prompt = buildCopyPastePrompt(
      [{ role: 'user', content: 'earlier q' }, { role: 'assistant', content: 'earlier a' }],
      'How do I start?',
      ctx
    );
    expect(prompt).toContain('Socratic tutor'); // system
    expect(prompt).toContain('Slide 2 of 3'); // context
    expect(prompt).toContain('Student: earlier q'); // conversation
    expect(prompt).toContain('Tutor: earlier a');
    expect(prompt.trimEnd().endsWith('Student: How do I start?')).toBe(true);
  });
});
