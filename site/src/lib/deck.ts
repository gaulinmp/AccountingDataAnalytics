// Shared runtime contract for the deck islands (imported by client scripts via
// relative path, since Vite-bundled <script> modules don't read tsconfig aliases).

/** The single event that ties DeckController → ReinforcementPane → AiTutor. */
export const SLIDE_CHANGE = 'slidechange';

export interface SlideChangeDetail {
  index: number;
  total: number;
  slideEl: HTMLElement;
}

/** localStorage namespace (avoids collisions if the origin is shared). */
export const NS = 'acctg5150';
