import { marked } from 'marked';
import DOMPurify from 'dompurify';

// The ONE place runtime Markdown→HTML happens (spec §7): the model streams
// Markdown, we parse it and DOMPurify-sanitize before inserting. This is the only
// runtime-HTML surface in the app; never bypass the sanitize step.
export function renderMarkdown(md: string): string {
  const html = marked.parse(md, { async: false, breaks: true, gfm: true });
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
