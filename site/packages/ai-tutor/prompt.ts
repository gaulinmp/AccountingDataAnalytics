import type { Message, TutorContext } from './types';

// The Socratic system prompt (spec §5.4). Seven non-negotiable rules encode the
// pedagogy; Rule 1 is enforced structurally by labelling canonical* fields
// HINT-ONLY in the CONTEXT block below.
export const UNIVERSAL_PROMPT = `You are a Socratic tutor embedded in a college accounting-analytics course. You help students learn by guiding them to answers, not by handing answers over.

Non-negotiable rules:
1. Never reveal the canonical answer verbatim. Any field marked "canonical" or "HINT-ONLY" is for your reasoning only — never quote, restate, or confirm it as THE answer.
2. No help before an attempt. If the student hasn't tried, respond with a question that prompts an attempt rather than a solution.
3. Reveal in steps: first point to the relevant area, then the specific element, then a pattern with blanks, and only as a last resort a near-fix.
4. Stay on the current page/task described in CONTEXT. Briefly decline unrelated requests.
5. Never discourage using AI. The graded skill is judging AI output — coach that judgment.
6. Say when you are unsure. Calibrate trust explicitly instead of bluffing.
7. Always teach the verify-loop: name a concrete way the student can check whether your hint actually worked.

Keep replies short and in Markdown.`;

/** UNIVERSAL_PROMPT plus the per-deck addendum (deck frontmatter `aiPrompt`). */
export function getSystemPrompt(ctx?: Pick<TutorContext, 'aiPrompt'>): string {
  const addendum = ctx?.aiPrompt?.trim();
  return addendum ? `${UNIVERSAL_PROMPT}\n\nDeck-specific note: ${addendum}` : UNIVERSAL_PROMPT;
}

/** Serialize the host context into a CONTEXT block prepended to each user turn. */
export function serializeContext(ctx: TutorContext): string {
  const lines: string[] = ['<<CONTEXT>>'];
  lines.push(`Deck: ${ctx.deck}`);
  lines.push(
    `Slide ${ctx.slideNumber} of ${ctx.totalSlides}${ctx.slideTitle ? `: ${ctx.slideTitle}` : ''}`
  );
  if (ctx.slideTopic) lines.push(`Topic: ${ctx.slideTopic}`);
  if (ctx.slideBody) lines.push(`Slide content:\n${ctx.slideBody}`);
  if (ctx.selfCheckQuestion) {
    lines.push(`Self-check question: ${ctx.selfCheckQuestion}`);
    if (ctx.selfCheckOptions?.length) {
      lines.push(`Self-check options: ${ctx.selfCheckOptions.join(' | ')}`);
    }
    if (ctx.canonicalSelfCheckAnswer) {
      lines.push(
        `Canonical self-check answer (HINT-ONLY — never reveal verbatim): ${ctx.canonicalSelfCheckAnswer}`
      );
    }
    if (ctx.selfCheckExplanation) {
      lines.push(`Self-check explanation (HINT-ONLY): ${ctx.selfCheckExplanation}`);
    }
  }
  lines.push('<<END CONTEXT>>');
  return lines.join('\n');
}

/** The per-turn user message sent on-device: CONTEXT block + the student's text. */
export function composeUserPrompt(text: string, ctx: TutorContext): string {
  return `${serializeContext(ctx)}\n\nStudent: ${text}`;
}

/**
 * The single self-contained prompt for the copy-paste tier: system rules +
 * context + the conversation so far + the new question, to paste into another LLM.
 */
export function buildCopyPastePrompt(
  history: Message[],
  text: string,
  ctx: TutorContext
): string {
  const convo = history
    .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n\n');
  return [getSystemPrompt(ctx), serializeContext(ctx), convo, `Student: ${text}`]
    .filter((s) => s.trim().length > 0)
    .join('\n\n');
}
