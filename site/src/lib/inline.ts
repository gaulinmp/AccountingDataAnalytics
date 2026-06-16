// Minimal inline formatter for authoring strings (e.g. Bullets `h`). Supports
// only **bold**, *em*, and `code` — NOT a Markdown parser (spec §7). It returns
// typed segments that <Inline> renders as real escaped elements, so there is no
// set:html / XSS surface anywhere in the block components (§11).

export type Seg =
  | { t: 'text'; v: string }
  | { t: 'strong'; v: string }
  | { t: 'em'; v: string }
  | { t: 'code'; v: string };

// `**bold**` is matched before `*em*`; backtick `code` is literal (no nesting).
const RE = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;

export function parseInline(input: string): Seg[] {
  const out: Seg[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  RE.lastIndex = 0;
  while ((m = RE.exec(input)) !== null) {
    if (m.index > last) out.push({ t: 'text', v: input.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: 'strong', v: m[1] });
    else if (m[2] !== undefined) out.push({ t: 'em', v: m[2] });
    else if (m[3] !== undefined) out.push({ t: 'code', v: m[3] });
    last = m.index + m[0].length;
  }
  if (last < input.length) out.push({ t: 'text', v: input.slice(last) });
  return out;
}
