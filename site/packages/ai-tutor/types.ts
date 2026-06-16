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
  /** HINT-ONLY — the model may reason with it but must never quote it. */
  canonicalSelfCheckAnswer?: string;
  selfCheckExplanation?: string;
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
