import type { Tier } from './types';

// Minimum Chrome that can run the Prompt API origin trial. Below this, upgrading
// actually helps (CHROME_OUTDATED); at/above but without the API, the student
// still lands in the copy-paste tier. (~stable Chrome 145–150 per spec §5.1.)
export const MIN_CHROME = 138;

export type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

/** Everything tier detection needs — injected so it's pure and unit-testable. */
export interface TierEnv {
  hasLanguageModel: boolean;
  availability: Availability | null;
  userAgent: string;
  /** ?ai-mode= override: 'copy-paste' | 'outdated-chrome' | 'on-device'. */
  modeOverride: string | null;
}

/**
 * Chrome major version, or null if this isn't desktop Google Chrome.
 * Edge (Edg/), Opera (OPR/), and mobile are deliberately excluded — they're
 * Chromium but don't expose the Prompt API, so they belong in OTHER_BROWSER.
 */
export function chromeVersion(ua: string): number | null {
  if (/Edg\/|EdgA\/|OPR\/|OPiOS|CriOS|FxiOS/.test(ua)) return null;
  if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) return null;
  const m = ua.match(/Chrome\/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function detectTier(env: TierEnv): Tier {
  // Test overrides win.
  if (env.modeOverride === 'copy-paste') return 'OTHER_BROWSER';
  if (env.modeOverride === 'outdated-chrome') return 'CHROME_OUTDATED';
  if (env.modeOverride === 'on-device') return 'ON_DEVICE';

  // Real capability is the primary signal.
  if (env.hasLanguageModel && env.availability && env.availability !== 'unavailable') {
    return 'ON_DEVICE';
  }

  // No usable API: an old Chrome can be upgraded; everything else is copy-paste.
  const chrome = chromeVersion(env.userAgent);
  if (chrome !== null && chrome < MIN_CHROME) return 'CHROME_OUTDATED';
  return 'OTHER_BROWSER';
}

/** Read the live browser environment (called by the element, not in tests). */
export function readEnv(win: Window & typeof globalThis): TierEnv {
  const params = new URLSearchParams(win.location.search);
  const lm = (win as unknown as { LanguageModel?: unknown }).LanguageModel;
  return {
    hasLanguageModel: typeof lm !== 'undefined',
    availability: null, // filled in asynchronously by the element if present
    userAgent: win.navigator.userAgent,
    modeOverride: params.get('ai-mode'),
  };
}
