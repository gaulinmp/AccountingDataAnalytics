// The context contract (spec §5.3). The host fills this each turn via
// `element.provideContext = () => ({...})`. The tutor knows nothing about slides
// specifically — only this shape. Any field named `canonical*` is HINT-ONLY: the
// prompt logic must never let the model reveal it verbatim (Rule 1).
export interface TutorContext {
  /** One chat thread per scope, e.g. `deck:<id>:slide:<n>`. */
  scopeKey: string;
  deck: string;
  slideNumber: number;
  totalSlides: number;
  slideTitle?: string;
  slideTopic?: string;
  slideBody?: string;
  selfCheckQuestion?: string;
  selfCheckOptions?: string[];
  /**
   * HINT-ONLY — kept in the contract for hosts that track it, but NEVER
   * serialized into any prompt (small models leak it; the copy-paste prompt is
   * visible to the student). prompt.ts ignores it by design.
   */
  canonicalSelfCheckAnswer?: string;
  /** HINT-ONLY — sent to the on-device tier only, never to copy-paste. */
  selfCheckExplanation?: string;
  /** Whether the student has checked an answer on this slide's self-check. */
  attempted?: boolean;
  /** The option text of the student's latest checked answer. */
  selectedOption?: string;
  /** Whether the latest checked answer was correct. */
  wasCorrect?: boolean;
  /** How many times the student has hit "Check answer" this visit. */
  attemptCount?: number;
  /** Per-slide instructor notes for the tutor (Slide `aiNotes`), never shown on the slide. */
  aiNotes?: string;
  seedQuestions?: string[];
  /** Per-deck system-prompt addendum (deck frontmatter `aiPrompt`). */
  aiPrompt?: string;
}

export type Tier = 'ON_DEVICE' | 'CHROME_OUTDATED' | 'OTHER_BROWSER';

export type Role = 'user' | 'assistant';

export interface Message {
  role: Role;
  content: string;
}
