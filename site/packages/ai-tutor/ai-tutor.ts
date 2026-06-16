import { STYLES } from './styles';
import { detectTier, readEnv, type Availability } from './tiers';
import { buildCopyPastePrompt, composeUserPrompt, getSystemPrompt } from './prompt';
import { renderMarkdown } from './markdown';
import type { Message, Tier, TutorContext } from './types';

// Minimal shape of Chrome's Prompt API (not in TS lib).
interface LMSession {
  promptStreaming(input: string): AsyncIterable<string>;
  destroy?(): void;
}
interface LanguageModelStatic {
  availability(opts?: unknown): Promise<Availability>;
  create(opts: unknown): Promise<LMSession>;
}
const getLM = (): LanguageModelStatic | undefined =>
  (self as unknown as { LanguageModel?: LanguageModelStatic }).LanguageModel;

const CONSENT_KEY = 'acctg5150:ai:consent';

/**
 * <ai-tutor> — a framework-agnostic Socratic tutor. The host sets
 * `el.provideContext = () => TutorContext` and calls `el.contextChanged()` when
 * the context changes (e.g. on slide change). Everything else is internal.
 */
export class AiTutor extends HTMLElement {
  /** Set by the host (spec §5.3). */
  public provideContext?: () => TutorContext;

  private root: ShadowRoot;
  private tier: Tier = 'OTHER_BROWSER';
  private availability: Availability | null = null;
  private transcripts = new Map<string, Message[]>();
  private sessions = new Map<string, LMSession>();
  private activeScope = '';
  private streaming = false;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    const env = readEnv(self as Window & typeof globalThis);
    this.tier = detectTier(env);

    // Refine the on-device decision with a real availability() probe.
    if (this.tier === 'ON_DEVICE' || env.hasLanguageModel) {
      try {
        const lm = getLM();
        if (lm) {
          this.availability = await lm.availability({
            expectedInputs: [{ type: 'text', languages: ['en'] }],
            expectedOutputs: [{ type: 'text', languages: ['en'] }],
          });
          this.tier = detectTier({ ...env, availability: this.availability });
        }
      } catch {
        this.tier = detectTier({ ...env, hasLanguageModel: false });
      }
    }

    this.renderShell();
    this.renderBody();
  }

  /** Host hook: re-pull context (new slide → new scope, chips, transcript). */
  public contextChanged() {
    if (!this.hasAttribute('open')) return;
    this.renderChips();
    this.renderTranscript();
  }

  // --- context helpers ----------------------------------------------------
  private ctx(): TutorContext {
    const fallback: TutorContext = { scopeKey: 'default', deck: '', slideNumber: 1, totalSlides: 1 };
    try {
      return this.provideContext?.() ?? fallback;
    } catch {
      return fallback;
    }
  }

  private history(scope: string): Message[] {
    let h = this.transcripts.get(scope);
    if (!h) {
      h = [];
      this.transcripts.set(scope, h);
    }
    return h;
  }

  // --- shell --------------------------------------------------------------
  private renderShell() {
    const tierLabel =
      this.tier === 'ON_DEVICE' ? 'On-device' : this.tier === 'CHROME_OUTDATED' ? 'Update needed' : 'Copy-paste';
    this.root.innerHTML = `
      <style>${STYLES}</style>
      <button class="launcher" part="launcher" type="button" aria-haspopup="dialog">💬 Ask AI</button>
      <section class="panel" role="dialog" aria-label="AI tutor">
        <header>
          <h2>AI tutor</h2>
          <span class="badge">${tierLabel}</span>
          <button class="icon-btn close" type="button" aria-label="Close">×</button>
        </header>
        <div class="body" aria-live="polite"></div>
        <div class="footer"></div>
      </section>
    `;
    this.root.querySelector('.launcher')!.addEventListener('click', () => this.open());
    this.root.querySelector('.close')!.addEventListener('click', () => this.close());
  }

  private open() {
    this.setAttribute('open', '');
    this.activeScope = this.ctx().scopeKey;
    this.renderBody();
  }
  private close() {
    this.removeAttribute('open');
  }

  private bodyEl() {
    return this.root.querySelector<HTMLElement>('.body')!;
  }
  private footerEl() {
    return this.root.querySelector<HTMLElement>('.footer')!;
  }

  // --- body rendering by tier --------------------------------------------
  private renderBody() {
    if (this.tier === 'CHROME_OUTDATED') return this.renderOutdated();
    if (this.tier === 'ON_DEVICE' && !this.consented()) return this.renderConsent();
    if (this.tier === 'ON_DEVICE') return this.renderChat();
    return this.renderCopyPaste();
  }

  private consented(): boolean {
    try {
      return localStorage.getItem(CONSENT_KEY) === 'accepted';
    } catch {
      return false;
    }
  }

  private renderOutdated() {
    this.bodyEl().innerHTML = `
      <div class="banner">
        Your Chrome is too old to run the on-device tutor. Update Chrome to the
        latest version to chat privately on your device — meanwhile you can still
        use the copy-paste option below.
      </div>`;
    this.footerEl().innerHTML = '';
    const again = document.createElement('button');
    again.className = 'send';
    again.type = 'button';
    again.textContent = 'Use copy-paste instead';
    again.addEventListener('click', () => {
      this.tier = 'OTHER_BROWSER';
      this.renderBody();
    });
    this.footerEl().appendChild(again);
  }

  private renderConsent() {
    this.bodyEl().innerHTML = `
      <p class="note">This tutor runs a small AI model <strong>entirely on your
      device</strong> — your questions never leave your browser. The first use
      downloads the model (a few hundred MB, one time).</p>`;
    this.footerEl().innerHTML = '';
    const accept = document.createElement('button');
    accept.className = 'send';
    accept.type = 'button';
    accept.textContent = 'Enable on-device tutor';
    accept.addEventListener('click', () => {
      try {
        localStorage.setItem(CONSENT_KEY, 'accepted');
      } catch {
        /* ignore */
      }
      this.renderChat();
      void this.ensureSession(this.ctx().scopeKey); // preload in the background
    });
    const decline = document.createElement('button');
    decline.className = 'link-btn';
    decline.type = 'button';
    decline.textContent = 'No thanks — copy-paste';
    decline.addEventListener('click', () => {
      this.tier = 'OTHER_BROWSER';
      this.renderBody();
    });
    this.footerEl().append(accept, decline);
  }

  // --- on-device chat -----------------------------------------------------
  private renderChat() {
    this.renderTranscript();
    this.footerEl().innerHTML = '<div class="chips"></div>';
    const composer = document.createElement('div');
    composer.className = 'composer';
    const ta = document.createElement('textarea');
    ta.placeholder = 'Ask about this slide…';
    ta.rows = 1;
    const send = document.createElement('button');
    send.className = 'send';
    send.type = 'button';
    send.textContent = 'Send';
    const submit = () => {
      const text = ta.value.trim();
      if (!text || this.streaming) return;
      ta.value = '';
      void this.sendOnDevice(text);
    };
    send.addEventListener('click', submit);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    });
    composer.append(ta, send);
    this.footerEl().appendChild(composer);
    this.renderChips();
  }

  private async ensureSession(scope: string): Promise<LMSession | null> {
    const existing = this.sessions.get(scope);
    if (existing) return existing;
    const lm = getLM();
    if (!lm) return null;
    const ctx = this.ctx();
    const progress = this.showProgress();
    try {
      const session = await lm.create({
        initialPrompts: [{ role: 'system', content: getSystemPrompt(ctx) }],
        monitor: (m: EventTarget) => {
          m.addEventListener('downloadprogress', (e: Event) => {
            const loaded = (e as Event & { loaded?: number }).loaded ?? 0;
            progress(loaded);
          });
        },
      });
      this.sessions.set(scope, session);
      progress(1);
      return session;
    } catch {
      progress(1);
      return null;
    }
  }

  private showProgress() {
    const wrap = document.createElement('div');
    wrap.className = 'progress';
    const bar = document.createElement('i');
    wrap.appendChild(bar);
    this.bodyEl().appendChild(wrap);
    return (loaded: number) => {
      bar.style.width = `${Math.round(Math.min(1, loaded) * 100)}%`;
      if (loaded >= 1) setTimeout(() => wrap.remove(), 400);
    };
  }

  private async sendOnDevice(text: string) {
    const ctx = this.ctx();
    this.activeScope = ctx.scopeKey;
    const hist = this.history(ctx.scopeKey);
    hist.push({ role: 'user', content: text });
    this.renderTranscript();

    const session = await this.ensureSession(ctx.scopeKey);
    const bubble = this.addBubble('assistant');
    if (!session) {
      bubble.textContent = 'The on-device model is unavailable right now. Try the copy-paste option.';
      return;
    }
    this.streaming = true;
    let acc = '';
    try {
      const stream = session.promptStreaming(composeUserPrompt(text, ctx));
      // The API yields incremental deltas; accumulate and re-render Markdown.
      for await (const chunk of stream) {
        acc += chunk;
        bubble.innerHTML = renderMarkdown(acc);
        this.scrollDown();
      }
    } catch {
      if (!acc) bubble.textContent = 'Something went wrong generating a reply.';
    } finally {
      this.streaming = false;
      hist.push({ role: 'assistant', content: acc });
    }
  }

  // --- copy-paste tier ----------------------------------------------------
  private renderCopyPaste() {
    this.renderTranscript();
    this.footerEl().innerHTML = '<div class="chips"></div>';
    const composer = document.createElement('div');
    composer.className = 'composer';
    const ta = document.createElement('textarea');
    ta.placeholder = 'Type your question, then build a prompt to paste into ChatGPT/Claude/Gemini…';
    const build = document.createElement('button');
    build.className = 'send';
    build.type = 'button';
    build.textContent = 'Build prompt';
    const submit = () => {
      const text = ta.value.trim();
      if (!text) return;
      ta.value = '';
      this.buildAndShowPrompt(text);
    };
    build.addEventListener('click', submit);
    composer.append(ta, build);
    this.footerEl().appendChild(composer);
    this.renderChips();
  }

  private buildAndShowPrompt(text: string) {
    const ctx = this.ctx();
    const hist = this.history(ctx.scopeKey);
    hist.push({ role: 'user', content: text });
    this.renderTranscript();

    const prompt = buildCopyPastePrompt(hist.slice(0, -1), text, ctx);
    const block = document.createElement('div');
    block.className = 'msg assistant';

    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = 'Copy this prompt into your AI of choice:';
    const area = document.createElement('textarea');
    area.className = 'copy-area';
    area.readOnly = true;
    area.value = prompt; // value (not innerHTML) — never interpreted as HTML

    const actions = document.createElement('div');
    actions.className = 'actions';
    const copy = document.createElement('button');
    copy.className = 'send';
    copy.type = 'button';
    copy.textContent = 'Copy';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(prompt);
        copy.textContent = 'Copied ✓';
        setTimeout(() => (copy.textContent = 'Copy'), 1500);
      } catch {
        area.select();
      }
    });
    const providers: [string, string][] = [
      ['ChatGPT', 'https://chatgpt.com/'],
      ['Claude', 'https://claude.ai/new'],
      ['Gemini', 'https://gemini.google.com/app'],
    ];
    actions.appendChild(copy);
    for (const [label, url] of providers) {
      const a = document.createElement('a');
      a.className = 'link-btn';
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = `Open ${label}`;
      actions.appendChild(a);
    }

    block.append(note, area, actions);
    this.bodyEl().appendChild(block);
    this.scrollDown();
  }

  // --- shared transcript + chips -----------------------------------------
  private renderTranscript() {
    const scope = this.ctx().scopeKey;
    this.activeScope = scope;
    const body = this.bodyEl();
    body.innerHTML = '';
    const hist = this.history(scope);
    if (hist.length === 0) {
      const hint = document.createElement('p');
      hint.className = 'note';
      hint.textContent = 'Ask about this slide. I’ll give hints, not answers.';
      body.appendChild(hint);
      return;
    }
    for (const m of hist) {
      const el = this.makeBubble(m.role);
      if (m.role === 'assistant') el.innerHTML = renderMarkdown(m.content);
      else el.textContent = m.content;
      body.appendChild(el);
    }
    this.scrollDown();
  }

  private makeBubble(role: 'user' | 'assistant') {
    const el = document.createElement('div');
    el.className = `msg ${role}`;
    return el;
  }
  private addBubble(role: 'user' | 'assistant') {
    const el = this.makeBubble(role);
    this.bodyEl().appendChild(el);
    this.scrollDown();
    return el;
  }

  private renderChips() {
    const holder = this.footerEl().querySelector<HTMLElement>('.chips');
    if (!holder) return;
    holder.innerHTML = '';
    const seeds = this.ctx().seedQuestions ?? [];
    for (const q of seeds) {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.type = 'button';
      chip.textContent = q;
      chip.addEventListener('click', () => {
        const ta = this.footerEl().querySelector('textarea');
        if (ta) {
          ta.value = q;
          ta.focus();
        }
      });
      holder.appendChild(chip);
    }
  }

  private scrollDown() {
    const b = this.bodyEl();
    b.scrollTop = b.scrollHeight;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('ai-tutor')) {
  customElements.define('ai-tutor', AiTutor);
}
