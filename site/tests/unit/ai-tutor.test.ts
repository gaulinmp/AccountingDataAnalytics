import { describe, expect, it } from 'vitest';
import { chromeVersion, detectTier, MIN_CHROME, type TierEnv } from '../../packages/ai-tutor/tiers';
import {
  UNIVERSAL_PROMPT,
  getSystemPrompt,
  serializeContext,
  serializeQuizState,
  composeUserPrompt,
  buildInitialPrompts,
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

describe('context serialization (Rule 1: canonical never serialized)', () => {
  it('never marks any option as the canonical answer, in any tier', () => {
    // The answer text may appear in the options list, but no line may label it.
    expect(serializeContext(ctx, 'on-device')).not.toMatch(/canonical/i);
    expect(serializeContext(ctx, 'copy-paste')).not.toMatch(/canonical/i);
  });
  it('on-device gets the explanation as HINT-ONLY; copy-paste gets neither', () => {
    const onDevice = serializeContext(ctx, 'on-device');
    expect(onDevice).toContain('Relational databases are queried with SQL JOINs.');
    expect(onDevice).toMatch(/HINT-ONLY/);
    expect(serializeContext(ctx, 'copy-paste')).not.toContain('SQL JOINs');
  });
  it('includes the slide locus and instructor notes', () => {
    expect(serializeContext(ctx)).toContain('Slide 2 of 3: Three places data lives');
    expect(serializeContext({ ...ctx, aiNotes: 'Students confuse CSVs with tables.' })).toContain(
      'Students confuse CSVs with tables.'
    );
  });
});

describe('quiz status (Rules 2–3: attempt-aware)', () => {
  it('flags an unattempted self-check so Rule 2 can bite', () => {
    expect(serializeQuizState(ctx)).toMatch(/NOT yet attempted/);
  });
  it('reports the specific attempt when one exists', () => {
    const status = serializeQuizState({
      ...ctx,
      attempted: true,
      selectedOption: 'A flat CSV',
      wasCorrect: false,
      attemptCount: 2,
    });
    expect(status).toContain('"A flat CSV" (incorrect)');
    expect(status).toContain('attempts so far: 2');
  });
  it('is empty when the slide has no self-check', () => {
    expect(serializeQuizState({ ...ctx, selfCheckQuestion: undefined })).toBe('');
  });
});

describe('per-turn prompt (context lives in initialPrompts, not each turn)', () => {
  it('sends only status + student text, not the slide context', () => {
    const turn = composeUserPrompt('How do I begin?', ctx);
    expect(turn).toContain('Student: How do I begin?');
    expect(turn).toContain('<<STATUS>>');
    expect(turn).not.toContain('<<CONTEXT>>');
  });
});

describe('initial prompts', () => {
  it('leads with system rules + static context, then the few-shot exchange', () => {
    const prompts = buildInitialPrompts(ctx);
    expect(prompts[0].role).toBe('system');
    expect(prompts[0].content).toContain('Socratic tutor');
    expect(prompts[0].content).toContain('<<CONTEXT>>');
    expect(prompts[1].role).toBe('user');
    expect(prompts[2].role).toBe('assistant');
  });
  it('replays at most the last 6 prior messages', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      role: (i % 2 ? 'assistant' : 'user') as 'user' | 'assistant',
      content: `msg ${i}`,
    }));
    const prompts = buildInitialPrompts(ctx, history);
    expect(prompts).toHaveLength(1 + 2 + 6);
    expect(prompts.at(-1)?.content).toBe('msg 9');
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
  it('never shows the student the answer or explanation (they read this prompt)', () => {
    const prompt = buildCopyPastePrompt([], 'help', ctx);
    // "canonical" appears only in the rules; no context line may label an answer.
    expect(prompt).not.toMatch(/Canonical self-check answer/);
    expect(prompt).not.toContain('SQL JOINs');
  });
});
