// Importing this module registers the <ai-tutor> custom element as a side effect.
import './ai-tutor';

export { AiTutor } from './ai-tutor';
export { detectTier, chromeVersion, MIN_CHROME, type TierEnv } from './tiers';
export {
  UNIVERSAL_PROMPT,
  getSystemPrompt,
  serializeContext,
  composeUserPrompt,
  buildCopyPastePrompt,
} from './prompt';
export { renderMarkdown } from './markdown';
export type { TutorContext, Tier, Message } from './types';
