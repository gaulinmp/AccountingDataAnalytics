// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../packages/ai-tutor/markdown';

describe('renderMarkdown (marked + DOMPurify)', () => {
  it('renders Markdown to HTML', () => {
    const html = renderMarkdown('A **JOIN** matches rows. `SELECT`');
    expect(html).toContain('<strong>JOIN</strong>');
    expect(html).toContain('<code>SELECT</code>');
  });

  it('strips a <script> in model output (no XSS)', () => {
    const html = renderMarkdown('hello <script>alert(1)</script> **world**');
    expect(html).not.toContain('<script');
    expect(html).toContain('<strong>world</strong>');
  });

  it('strips event-handler attributes and javascript: URLs', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)"> [x](javascript:alert(1))');
    expect(html).not.toMatch(/onerror/i);
    expect(html).not.toMatch(/javascript:/i);
  });
});
