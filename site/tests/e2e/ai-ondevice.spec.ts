import { expect, test } from '@playwright/test';

const DECK = '/week-03/3-1-vis-overview/';

test.use({ viewport: { width: 1280, height: 800 } });

// We can't run real Gemini Nano in CI, so mock window.LanguageModel and assert the
// WIRING: the system prompt is sent on create, the CONTEXT block is streamed on
// each turn, and the streamed Markdown is rendered + sanitized (spec §5, §7).
test('on-device wiring: system prompt + context sent, output sanitized', async ({ page }) => {
  await page.addInitScript(() => {
    const calls: { create: unknown[]; prompts: string[] } = { create: [], prompts: [] };
    (window as unknown as { __aiCalls: typeof calls }).__aiCalls = calls;
    (window as unknown as { LanguageModel: unknown }).LanguageModel = {
      async availability() {
        return 'available';
      },
      async create(opts: { initialPrompts?: unknown }) {
        calls.create.push({ initialPrompts: opts.initialPrompts });
        return {
          async *promptStreaming(input: string) {
            calls.prompts.push(input);
            yield 'Here is a **hint** for you. ';
            yield 'Ignore this: <script>window.__pwned = 1</script> ';
            yield 'Check the JOIN keys.';
          },
          destroy() {},
        };
      },
    };
  });

  await page.goto(`${DECK}?ai-mode=on-device&slide=2`);
  await expect(page.locator('[data-deck]')).toHaveAttribute('data-active', '1');

  await page.locator('.launcher').click();
  await page.getByRole('button', { name: 'Enable on-device tutor' }).click();
  await page.locator('.composer textarea').fill('How do I begin?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();

  const bubble = page.locator('.msg.assistant').last();
  await expect(bubble).toContainText('Check the JOIN keys.');

  // Markdown rendered…
  await expect(bubble.locator('strong')).toHaveText('hint');
  // …and the injected <script> neither rendered nor executed.
  await expect(bubble.locator('script')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();

  // Wiring assertions.
  const calls = await page.evaluate(
    () => (window as unknown as { __aiCalls: { create: { initialPrompts: { content: string }[] }[]; prompts: string[] } }).__aiCalls
  );
  expect(calls.create[0].initialPrompts[0].content).toContain('Socratic tutor');
  expect(calls.create[0].initialPrompts[0].content).toMatch(/never reveal the canonical answer/i);
  expect(calls.prompts[0]).toContain('Slide 2 of 7');
  expect(calls.prompts[0]).toContain('Student: How do I begin?');
});
