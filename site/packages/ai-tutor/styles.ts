// Shadow-DOM styles for <ai-tutor>. Self-contained (the component is a drop-in),
// so brand colour is a local var overridable via the `--ai-brand` custom property.
export const STYLES = /* css */ `
  :host {
    --ai-brand: #cc0000;
    --ai-brand-hover: #a60000;
    --ai-brand-contrast: #ffffff;
    --ai-ink: #212529;
    --ai-muted: #5f666d;
    --ai-border: #e9ecef;
    --ai-surface: #ffffff;
    --ai-surface-muted: #f8f9fa;
    --ai-radius-lg: 16px;
    --ai-radius-md: 12px;
    --ai-radius-sm: 8px;
    --ai-shadow-premium: 0 10px 30px rgba(0, 0, 0, 0.08);
    --ai-shadow-message: 0 2px 8px rgba(0, 0, 0, 0.04);
    
    font-family: 'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
    color: var(--ai-ink);
  }

  * { box-sizing: border-box; }

  /* Launcher Button */
  .launcher {
    position: fixed;
    right: 1.5rem;
    bottom: 1.5rem;
    z-index: 60;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    border: 0;
    border-radius: 999px;
    padding: 0.75rem 1.25rem;
    background: linear-gradient(135deg, #cc0000 0%, #ff4d4d 100%);
    color: var(--ai-brand-contrast);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(204, 0, 0, 0.25);
    transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms ease, background 200ms ease;
  }
  .launcher:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 12px 30px rgba(204, 0, 0, 0.35);
  }
  .launcher:active {
    transform: translateY(-1px) scale(0.98);
  }

  /* Chat Panel Container */
  .panel {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    left: auto;
    z-index: 61;
    width: 400px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--ai-surface);
    border-left: 1px solid var(--ai-border);
    box-shadow: -10px 0 40px rgba(0, 0, 0, 0.1);
    transform: translateX(100%);
    transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), visibility 400ms;
    visibility: hidden;
    overflow: hidden;
  }
  
  :host([open]) .panel {
    transform: translateX(0);
    visibility: visible;
  }
  :host([open]) .launcher {
    transform: scale(0);
    opacity: 0;
    pointer-events: none;
  }

  /* Header Section */
  header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #cc0000 0%, #ff4d4d 100%);
    color: var(--ai-brand-contrast);
    position: relative;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }
  
  header h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    flex: 1;
    letter-spacing: -0.01em;
  }
  
  .badge {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  
  .icon-btn.close {
    border: 0;
    background: rgba(255, 255, 255, 0.15);
    color: inherit;
    font-size: 1.3rem;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 200ms ease;
    line-height: 1;
  }
  .icon-btn.close:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
  .icon-btn.close:active {
    transform: scale(0.95);
  }

  /* Scrollable Body */
  .body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    background: var(--ai-surface-muted);
    scroll-behavior: smooth;
  }

  /* Message List Styling */
  .msg {
    margin: 0 0 1rem;
    padding: 0.85rem 1.1rem;
    border-radius: var(--ai-radius-lg);
    font-size: 0.92rem;
    line-height: 1.5;
    max-width: 85%;
    box-shadow: var(--ai-shadow-message);
    position: relative;
    word-break: break-word;
  }
  
  .msg.user {
    background: linear-gradient(135deg, #cc0000 0%, #ff4d4d 100%);
    color: var(--ai-brand-contrast);
    margin-left: auto;
    border-bottom-right-radius: 4px;
    font-weight: 500;
  }
  
  .msg.assistant {
    background: var(--ai-surface);
    border: 1px solid var(--ai-border);
    margin-right: auto;
    border-bottom-left-radius: 4px;
    color: var(--ai-ink);
  }

  /* Empty Assistant Bubble Typing Indicator */
  .msg.assistant:empty {
    min-width: 3.5rem;
    min-height: 2.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .msg.assistant:empty::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ai-brand);
    animation: typingPulse 1.2s infinite ease-in-out;
    box-shadow: 10px 0 0 var(--ai-brand), -10px 0 0 var(--ai-brand);
  }
  
  @keyframes typingPulse {
    0%, 100% { transform: scale(0.8); opacity: 0.4; }
    50% { transform: scale(1.2); opacity: 1; }
  }

  .msg.assistant :first-child { margin-top: 0; }
  .msg.assistant :last-child { margin-bottom: 0; }
  
  .msg.assistant pre {
    overflow-x: auto;
    background: #1a1e22;
    color: #f1f3f5;
    padding: 0.75rem;
    border-radius: var(--ai-radius-sm);
    margin: 0.5rem 0;
  }
  
  .msg.assistant code {
    font-family: ui-monospace, monospace;
    font-size: 0.85em;
  }

  /* Footer Controls Section */
  .footer {
    border-top: 1px solid var(--ai-border);
    padding: 1.25rem 1.5rem;
    background: var(--ai-surface);
  }

  /* Suggestion Chips */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  
  .chip {
    border: 1px solid var(--ai-border);
    background: var(--ai-surface-muted);
    color: var(--ai-muted);
    border-radius: 999px;
    padding: 0.4rem 0.8rem;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 200ms ease;
  }
  .chip:hover {
    border-color: rgba(204, 0, 0, 0.3);
    background: rgba(204, 0, 0, 0.03);
    color: var(--ai-brand);
    transform: translateY(-1px);
  }
  .chip:active {
    transform: translateY(0);
  }

  /* Text Composer */
  .composer {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
  }
  
  textarea {
    flex: 1;
    resize: none;
    min-height: 2.5rem;
    max-height: 8rem;
    padding: 0.6rem 0.85rem;
    border: 1px solid var(--ai-border);
    border-radius: var(--ai-radius-md);
    font: inherit;
    font-size: 0.88rem;
    transition: all 200ms ease;
    background: var(--ai-surface-muted);
  }
  textarea:focus {
    outline: none;
    border-color: var(--ai-brand);
    background: var(--ai-surface);
    box-shadow: 0 0 0 3px rgba(204, 0, 0, 0.08);
  }
  
  .send {
    border: 0;
    border-radius: var(--ai-radius-md);
    padding: 0.6rem 1.1rem;
    background: linear-gradient(135deg, #cc0000 0%, #ff4d4d 100%);
    color: var(--ai-brand-contrast);
    font: inherit;
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(204, 0, 0, 0.15);
    transition: all 200ms ease;
    align-self: flex-end;
    height: 2.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .send:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 15px rgba(204, 0, 0, 0.22);
  }
  .send:active:not(:disabled) {
    transform: translateY(0);
  }
  .send:disabled {
    background: var(--ai-border);
    color: var(--ai-muted);
    box-shadow: none;
    cursor: not-allowed;
  }

  /* Extra widgets: note, banner, progress */
  .note {
    color: var(--ai-muted);
    font-size: 0.8rem;
    margin: 0.25rem 0 0.5rem;
    line-height: 1.4;
  }
  
  .banner {
    padding: 0.85rem 1.1rem;
    border-radius: var(--ai-radius-md);
    background: #fff9db;
    border: 1px solid #ffe066;
    font-size: 0.85rem;
    color: #665200;
    line-height: 1.5;
    margin-bottom: 1rem;
  }
  
  .progress {
    height: 6px;
    background: var(--ai-border);
    border-radius: 999px;
    overflow: hidden;
    margin: 0.5rem 0;
  }
  .progress > i {
    display: block;
    height: 100%;
    width: 0;
    background: linear-gradient(135deg, #cc0000 0%, #ff4d4d 100%);
    transition: width 0.2s;
  }

  /* Action links & copy-paste panel UI elements */
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  
  .link-btn {
    text-decoration: none;
    border: 1px solid var(--ai-border);
    border-radius: var(--ai-radius-sm);
    padding: 0.4rem 0.8rem;
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--ai-ink);
    background: var(--ai-surface);
    transition: all 200ms ease;
    display: inline-flex;
    align-items: center;
  }
  .link-btn:hover {
    border-color: var(--ai-brand);
    color: var(--ai-brand);
    background: rgba(204, 0, 0, 0.02);
  }
  
  .copy-area {
    width: 100%;
    min-height: 9rem;
    font-family: ui-monospace, monospace;
    font-size: 0.75rem;
    padding: 0.6rem;
    border: 1px solid var(--ai-border);
    border-radius: var(--ai-radius-sm);
    background: var(--ai-surface-muted);
    resize: vertical;
    transition: border-color 200ms ease;
  }
  .copy-area:focus {
    outline: none;
    border-color: var(--ai-brand);
  }

  /* Mobile / responsive adjustments */
  @media (max-width: 767px) {
    .panel {
      right: 0;
      left: 0;
      top: auto;
      bottom: 0;
      width: 100vw;
      height: 80vh;
      border-top-left-radius: var(--ai-radius-lg);
      border-top-right-radius: var(--ai-radius-lg);
      border-left: 0;
      border-top: 1px solid var(--ai-border);
      transform: translateY(100%);
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.08);
      transition: transform 350ms cubic-bezier(0.4, 0, 0.2, 1), visibility 350ms;
    }
    
    :host([open]) .panel {
      transform: translateY(0);
    }
    
    .launcher {
      right: 1rem;
      bottom: 1rem;
      padding: 0.7rem 1.15rem;
      font-size: 0.9rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .progress > i { transition: none; }
    .panel { transition: none; }
    .launcher { transition: none; }
  }
`;
