// ==UserScript==
// @name         6HW
// @namespace    https://utah.instructure.com/
// @version      0.5
// @description  Homework 6 SpeedGrader automation: autocheck Q1/4/7 SQL, 4-row review (3 paired image/blurb rows + Q10 full width), Alt+1 submit & advance.
// @match        *://*.instructure.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log("[HW6] loaded");

    if (window !== window.top) {
        window.addEventListener('keydown', (e) => {
            if (e.altKey && (e.code === 'Digit1' || e.code === 'KeyG')) {
                e.preventDefault();
                e.stopPropagation();
                window.top.postMessage({ type: 'SG_HOTKEY', code: e.code }, '*');
            }
        }, true);
        return;
    }

    const FEEDBACK_OPTIONS = [
        "Missing required columns, I can't tell if the SQL worked",
        "Didn't achieve the requested join",
        "Unrelated conclusion",
        "Repeated conclusion"
    ];

    // Card configurations: 0: Q2/Q3, 1: Q5/Q6, 2: Q8/Q9, 3: Q10
    const CARDS = [
        { imgQ: 2, textQ: 3, label: "Q2/Q3: 1-Day Return Merge (Screenshot & Blurb)", imgMax: 4, textMax: 2 },
        { imgQ: 5, textQ: 6, label: "Q5/Q6: 3-Day Window EA Merge (Screenshot & Blurb)", imgMax: 4, textMax: 2 },
        { imgQ: 8, textQ: 9, label: "Q8/Q9: 1-Year Cumulative Return (Screenshot & Blurb)", imgMax: 4, textMax: 2 },
        { imgQ: null, textQ: 10, label: "Q10: LLM Strategy Synthesis (3 pts)", imgMax: 0, textMax: 3 }
    ];
    console.log(CARDS);

    const freshDock = () => CARDS.map(() => ({ img: { docked: false, comment: "" }, text: { docked: false, comment: "" } }));
    let dockedState = freshDock();
    let currentData = CARDS.map(() => ({ imgSrc: "", text: "" }));

    const css = `
        #sg-lab6-overlay {
            position: fixed !important;
            inset: 0 !important;
            background: rgba(15, 23, 42, 0.95) !important;
            backdrop-filter: blur(4px) !important;
            z-index: 2147483646 !important;
            display: none;
            flex-direction: column !important;
            padding: 12px 16px !important;
            box-sizing: border-box !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            color: #f8fafc !important;
        }
        #sg-lab6-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-bottom: 8px !important;
        }
        #sg-lab6-header h3 {
            margin: 0 !important;
            font-size: 15px !important;
            color: #38bdf8 !important;
        }
        #sg-lab6-header kbd {
            background: #334155 !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            color: #fff !important;
            border: 1px solid #64748b !important;
        }
        #sg-lab6-grid {
            display: grid !important;
            grid-template-rows: repeat(3, minmax(0, 1.35fr)) minmax(0, 0.95fr) !important;
            gap: 8px !important;
            flex: 1 !important;
            min-height: 0 !important;
        }
        .sg-card {
            background: #1e293b !important;
            border: 1.5px solid #334155 !important;
            border-radius: 6px !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            cursor: pointer !important;
            min-height: 0 !important;
            transition: border-color 0.15s ease !important;
        }
        .sg-card:hover { border-color: #38bdf8 !important; }
        .sg-card.docked {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 1.5px #ef4444 !important;
        }
        .sg-card-bar {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 4px 10px !important;
            background: #0f172a !important;
            border-bottom: 1px solid #334155 !important;
            font-size: 12px !important;
            font-weight: 600 !important;
        }
        .sg-badge {
            padding: 1px 6px !important;
            border-radius: 4px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
        }
        .sg-badge.full { background: #065f46 !important; color: #34d399 !important; }
        .sg-badge.docked { background: #7f1d1d !important; color: #fca5a5 !important; }

        .sg-card-body {
            flex: 1 !important;
            min-height: 0 !important;
            display: flex !important;
            background: #0b1120 !important;
        }
        .sg-card-img-wrap {
            width: 75% !important;
            height: 100% !important;
            background: #020617 !important;
            border-right: 1px solid #334155 !important;
            display: flex !important;
            align-items: flex-start !important;
            justify-content: center !important;
            overflow: hidden !important;
            position: relative !important;
        }
        /* Fit to width, pin to top; anything taller than the card is clipped */
        .sg-card-img-wrap img {
            width: 100% !important;
            height: auto !important;
            max-width: none !important;
            max-height: none !important;
            flex-shrink: 0 !important;
        }
        .sg-card-text-wrap {
            width: 25% !important;
            height: 100% !important;
            padding: 8px 10px !important;
            overflow-y: auto !important;
            color: #cbd5e1 !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            white-space: pre-wrap !important;
            word-break: break-word !important;
            box-sizing: border-box !important;
        }
        .sg-card-full-wrap {
            width: 100% !important;
            height: 100% !important;
            padding: 8px 12px !important;
            overflow-y: auto !important;
            color: #cbd5e1 !important;
            font-size: 12.5px !important;
            line-height: 1.45 !important;
            white-space: pre-wrap !important;
            word-break: break-word !important;
            box-sizing: border-box !important;
        }
        .sg-pane-docked { box-shadow: inset 0 0 0 2px #ef4444 !important; }
        .sg-card-feedback {
            background: #450a0a !important;
            color: #fca5a5 !important;
            font-size: 11px !important;
            padding: 3px 10px !important;
            border-top: 1px solid #b91c1c !important;
        }
        #sg-feedback-modal-overlay {
            position: fixed !important;
            inset: 0 !important;
            background: rgba(0, 0, 0, 0.75) !important;
            z-index: 2147483647 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        #sg-feedback-modal {
            background: #1e293b !important;
            border: 1.5px solid #475569 !important;
            border-radius: 8px !important;
            padding: 18px 22px !important;
            width: 500px !important;
            color: #f8fafc !important;
            box-shadow: 0 16px 36px rgba(0,0,0,0.6) !important;
        }
        #sg-feedback-modal h4 {
            margin: 0 0 12px 0 !important;
            font-size: 14px !important;
            color: #38bdf8 !important;
            display: flex !important;
            justify-content: space-between !important;
        }
        .sg-opt-btn {
            width: 100% !important;
            background: #334155 !important;
            border: 1px solid #475569 !important;
            color: #fff !important;
            padding: 8px 12px !important;
            border-radius: 5px !important;
            text-align: left !important;
            cursor: pointer !important;
            font-size: 12.5px !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            margin-bottom: 6px !important;
            line-height: 1.35 !important;
        }
        .sg-opt-btn:hover { background: #475569 !important; }
        .sg-opt-btn kbd {
            background: #0f172a !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            font-weight: 700 !important;
            border: 1px solid #64748b !important;
            flex-shrink: 0 !important;
        }
        .sg-clear-btn { background: #7f1d1d !important; border-color: #991b1b !important; margin-top: 6px !important; }
        #sg-toast {
            position: fixed !important;
            bottom: 24px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            background: #0284c7 !important;
            color: #fff !important;
            padding: 10px 20px !important;
            border-radius: 6px !important;
            font-weight: 600 !important;
            font-size: 13px !important;
            z-index: 2147483647 !important;
            box-shadow: 0 6px 20px rgba(0,0,0,0.4) !important;
            display: none;
        }
    `;

    function injectCSS() {
        if (document.getElementById('sg-lab6-styles')) return;
        const style = document.createElement('style');
        style.id = 'sg-lab6-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }
    injectCSS();

    function triggerClick(el) {
        if (!el) return;
        const win = el.ownerDocument?.defaultView || window;
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: win }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: win }));
        if (typeof el.click === 'function') el.click();
        else el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: win }));
    }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function setInputValue(input, val) {
        if (!input) return;
        input.focus();
        const win = input.ownerDocument?.defaultView || window;
        const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value')?.set
                    || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

        if (input._valueTracker) input._valueTracker.setValue('');
        if (setter) setter.call(input, val);
        else input.value = val;

        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
    }

    function showToast(msg, duration = 3000) {
        let toast = document.getElementById('sg-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'sg-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.display = 'block';
        if (duration > 0) setTimeout(() => { toast.style.display = 'none'; }, duration);
    }

    function getIframeDoc() {
        const iframe = document.getElementById('speedgrader_iframe') || document.querySelector('iframe');
        if (!iframe) return null;
        try {
            return iframe.contentDocument || iframe.contentWindow?.document || null;
        } catch (e) { return null; }
    }

    function getQuestionContainer(doc, qNum) {
        if (!doc) return null;
        const sdkWrappers = [...doc.querySelectorAll('[data-automation="sdk-grading-result-wrapper"]')];
        let found = sdkWrappers.find(w => {
            const txt = (w.innerText || '').toLowerCase();
            return txt.includes(`results for question ${qNum}.`) || txt.includes(`question ${qNum}.`);
        });

        if (!found) {
            const candidates = [...doc.querySelectorAll('div, section')].filter(el => {
                const txt = (el.innerText || '').toLowerCase();
                const hasTitle = txt.includes(`results for question ${qNum}.`) || txt.includes(`results for question ${qNum}\n`);
                if (!hasTitle) return false;
                const hasBtn = [...el.querySelectorAll('button')].some(b => (b.innerText || '').toLowerCase().includes('award full credit'));
                const hasInput = !!el.querySelector('input[data-automation="sdk-grading-edit-score-input"], input[role="spinbutton"], input.question_score');
                return hasBtn || hasInput;
            });
            if (candidates.length > 0) {
                candidates.sort((a, b) => (a.innerText?.length || 0) - (b.innerText?.length || 0));
                found = candidates[0];
            }
        }
        return found || null;
    }

    function extractAnswerText(container) {
        if (!container) return "";
        const text = container.innerText || "";
        for (const marker of ["Waiting for grade", "Graded", "Incorrect", "Correct"]) {
            const start = text.indexOf(marker);
            const end = text.lastIndexOf(marker);
            if (start !== -1 && end > start) return text.slice(start + marker.length, end).trim();
        }
        return "";
    }

    function isUploadImg(img) {
        const s = (img.src || '').toLowerCase();
        return s && !s.includes('avatar') && !s.includes('icon') && !s.includes('svg');
    }

    // Same search as tm_5lab.js: any non-icon <img>, else a files/download link.
    function extractImageSrc(container) {
        if (!container) return "";
        const img = [...container.querySelectorAll('img')].find(isUploadImg);
        if (img) return img.src;
        const link = container.querySelector('a[href*="files"], a[href*="download"]');
        return link ? link.href : "";
    }

    function scanContent() {
        const doc = getIframeDoc();
        if (!doc) return false;

        let hasFoundAny = false;
        try {
            CARDS.forEach((c, idx) => {
                let imgSrc = "";
                let text = "";

                if (c.imgQ) {
                    const imgWrap = getQuestionContainer(doc, c.imgQ);
                    imgSrc = extractImageSrc(imgWrap);
                    console.debug(`[HW6] Q${c.imgQ}: container=${!!imgWrap} img=${imgSrc || '(none)'}`);
                }
                if (c.textQ) {
                    const textWrap = getQuestionContainer(doc, c.textQ);
                    text = extractAnswerText(textWrap);
                    console.debug(`[HW6] Q${c.textQ}: container=${!!textWrap} text=${text.length} chars`);
                }

                if (imgSrc || text) hasFoundAny = true;
                currentData[idx] = { imgSrc, text };
            });

            // Image fallback (from tm_5lab.js): take uploads in page order for any card still missing one.
            const imgCards = CARDS.map((_, i) => i).filter(i => CARDS[i].imgQ);
            if (imgCards.some(i => !currentData[i].imgSrc)) {
                const uploads = [...doc.querySelectorAll('img')].filter(img => {
                    const s = (img.src || '').toLowerCase();
                    return isUploadImg(img) && (s.includes('download') || s.includes('files') || s.includes('preview'));
                });
                imgCards.forEach((cardIdx, n) => {
                    if (!currentData[cardIdx].imgSrc && uploads[n]) {
                        currentData[cardIdx].imgSrc = uploads[n].src;
                        hasFoundAny = true;
                    }
                });
            }

            if (hasFoundAny) updateOverlayCards();
        } catch (err) {
            console.error('[HW6] scanContent failed:', err);
            return false;
        }
        if (!hasFoundAny) console.warn('[HW6] scanContent found no images or text');
        return hasFoundAny;
    }

    function buildOverlay() {
        if (document.getElementById('sg-lab6-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'sg-lab6-overlay';
        overlay.innerHTML = `
            <div id="sg-lab6-header">
                <h3>Lab 6 ETL - Rows 1–3: Screenshot (75%) + Blurb (25%) | Row 4: Q10 Full Width</h3>
                <div>
                    Click card to dock | <kbd>Alt+1</kbd> grade Q1-Q10 & advance | <kbd>Esc</kbd> hide
                </div>
            </div>
            <div id="sg-lab6-grid">
                ${CARDS.map((card, i) => {
                    if (card.imgQ) {
                        return `
                            <div class="sg-card" data-index="${i}">
                                <div class="sg-card-bar">
                                    <span>${card.label}</span>
                                    <span class="sg-badge full">Full Credit</span>
                                </div>
                                <div class="sg-card-body">
                                    <div class="sg-card-img-wrap">
                                        <span style="color:#64748b;font-size:12px;">Loading screenshot...</span>
                                    </div>
                                    <div class="sg-card-text-wrap">
                                        <span style="color:#64748b;">Loading reflection blurb...</span>
                                    </div>
                                </div>
                                <div class="sg-card-feedback" style="display: none;"></div>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="sg-card" data-index="${i}">
                                <div class="sg-card-bar">
                                    <span>${card.label}</span>
                                    <span class="sg-badge full">3/3 Full Credit</span>
                                </div>
                                <div class="sg-card-body">
                                    <div class="sg-card-full-wrap">
                                        <span style="color:#64748b;">Loading strategy reflection...</span>
                                    </div>
                                </div>
                                <div class="sg-card-feedback" style="display: none;"></div>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelectorAll('.sg-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const idx = parseInt(card.getAttribute('data-index'), 10);
                const line = e.target.closest('[data-target]');
                const target = line ? line.getAttribute('data-target')
                    : (CARDS[idx].imgQ && e.target.closest('.sg-card-img-wrap')) ? 'img' : 'text';
                openFeedbackModal(idx, target);
            });
        });
    }

    function updateOverlayCards() {
        buildOverlay();
        CARDS.forEach((cardCfg, i) => {
            const cardEl = document.querySelector(`.sg-card[data-index="${i}"]`);
            if (!cardEl) return;
            const data = currentData[i];

            if (cardCfg.imgQ) {
                const imgWrap = cardEl.querySelector('.sg-card-img-wrap');
                const textWrap = cardEl.querySelector('.sg-card-text-wrap');

                if (data.imgSrc) {
                    imgWrap.innerHTML = `<img src="${data.imgSrc}" alt="Submission Preview" />`;
                    imgWrap.querySelector('img').addEventListener('error', () => {
                        imgWrap.innerHTML = `<a href="${data.imgSrc}" target="_blank" style="color:#38bdf8;">Open Image File</a>`;
                    });
                } else {
                    imgWrap.innerHTML = `<span style="color:#64748b;font-size:12px;">No screenshot image found &mdash; Q${cardCfg.imgQ} will get 0</span>`;
                }

                if (data.text) {
                    const safe = data.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    textWrap.innerHTML = safe.replace(/\b(SELECT|JOIN|ON|FROM|WHERE|EXP|SUM|LN|COUNT)\b/g, '<b>$1</b>');
                }
            } else {
                const fullWrap = cardEl.querySelector('.sg-card-full-wrap');
                if (data.text) {
                    fullWrap.textContent = data.text;
                }
            }
        });
    }

    function toggleOverlay(forceState) {
        buildOverlay();
        const overlay = document.getElementById('sg-lab6-overlay');
        const show = forceState !== undefined ? forceState : (overlay.style.display !== 'flex');
        overlay.style.display = show ? 'flex' : 'none';
        if (show) scanContent();
    }

    function updateCardState(idx) {
        const card = document.querySelector(`.sg-card[data-index="${idx}"]`);
        if (!card) return;
        const cfg = CARDS[idx];
        const state = dockedState[idx];
        const badge = card.querySelector('.sg-badge');
        const feedbackBar = card.querySelector('.sg-card-feedback');
        const qFor = (t) => t === 'img' ? cfg.imgQ : cfg.textQ;
        const docked = (cfg.imgQ ? ['img', 'text'] : ['text']).filter(t => state[t].docked);

        card.querySelector('.sg-card-img-wrap')?.classList.toggle('sg-pane-docked', state.img.docked);
        card.querySelector('.sg-card-text-wrap, .sg-card-full-wrap')?.classList.toggle('sg-pane-docked', state.text.docked);

        if (docked.length) {
            card.classList.add('docked');
            badge.className = 'sg-badge docked';
            badge.textContent = docked.map(t => `Q${qFor(t)} -1 pt`).join(', ');
            feedbackBar.style.display = 'block';
            feedbackBar.innerHTML = docked.map(t =>
                `<div data-target="${t}" style="display:flex;justify-content:space-between;"><span><strong>Q${qFor(t)}:</strong> ${state[t].comment}</span><span style="opacity:0.75;font-size:11px;">(click to edit)</span></div>`
            ).join('');
        } else {
            card.classList.remove('docked');
            badge.className = 'sg-badge full';
            badge.textContent = cfg.imgQ ? 'Full Credit' : '3/3 Full Credit';
            feedbackBar.style.display = 'none';
            feedbackBar.textContent = '';
        }
    }

    function openFeedbackModal(idx, target) {
        const existing = document.getElementById('sg-feedback-modal-overlay');
        if (existing) existing.remove();

        const pane = dockedState[idx][target];
        const qNum = target === 'img' ? CARDS[idx].imgQ : CARDS[idx].textQ;
        const isDocked = pane.docked;
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'sg-feedback-modal-overlay';

        let buttons = FEEDBACK_OPTIONS.map((opt, i) => `
            <button class="sg-opt-btn" data-comment="${opt}">
                <kbd>${i + 1}</kbd> <span>${opt}</span>
            </button>
        `).join('');

        if (isDocked) {
            buttons += `
                <button class="sg-opt-btn sg-clear-btn" data-action="clear">
                    <kbd>C</kbd> <span>Clear penalty (restore full credit)</span>
                </button>
            `;
        }

        modalOverlay.innerHTML = `
            <div id="sg-feedback-modal">
                <h4>Dock 1 pt: Q${qNum} (${target === 'img' ? 'screenshot' : CARDS[idx].imgQ ? 'blurb' : 'reflection'}) <span><kbd>Esc</kbd></span></h4>
                <div>${buttons}</div>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        function cleanup() {
            window.removeEventListener('keydown', handleKey, true);
            modalOverlay.remove();
        }

        function setReason(txt) {
            pane.docked = true;
            pane.comment = txt;
            updateCardState(idx);
            cleanup();
        }

        function clearPenalty() {
            pane.docked = false;
            pane.comment = "";
            updateCardState(idx);
            cleanup();
        }

        modalOverlay.querySelectorAll('.sg-opt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (btn.getAttribute('data-action') === 'clear') clearPenalty();
                else setReason(btn.getAttribute('data-comment'));
            });
        });

        modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) cleanup(); });

        function handleKey(e) {
            const num = parseInt(e.key, 10);
            if (!isNaN(num) && num >= 1 && num <= FEEDBACK_OPTIONS.length) {
                e.preventDefault(); e.stopPropagation();
                setReason(FEEDBACK_OPTIONS[num - 1]);
                return;
            }
            if (e.key.toLowerCase() === 'c' && isDocked) {
                e.preventDefault(); e.stopPropagation();
                clearPenalty();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault(); e.stopPropagation();
                cleanup();
            }
        }
        window.addEventListener('keydown', handleKey, true);
    }

    function submitComments(text) {
        if (!text) return;
        let inserted = false;

        if (window.tinymce) {
            const editor = window.tinymce.get('speedgrader_comment_textarea') || window.tinymce.activeEditor;
            if (editor && !editor.isHidden()) {
                editor.setContent(`<p>${text.replace(/\n/g, '<br/>')}</p>`);
                editor.fire('change');
                inserted = true;
            }
        }
        if (!inserted) {
            const editable = document.querySelector('.tox-edit-area, [contenteditable="true"][role="textbox"]');
            if (editable) {
                editable.focus();
                editable.innerHTML = text.split('\n').map(l => `<p>${l}</p>`).join('');
                editable.dispatchEvent(new Event('input', { bubbles: true }));
                editable.dispatchEvent(new Event('change', { bubbles: true }));
                inserted = true;
            }
        }
        if (!inserted) {
            const ta = document.getElementById('speedgrader_comment_textarea');
            if (ta) {
                ta.value = text;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                ta.dispatchEvent(new Event('change', { bubbles: true }));
                inserted = true;
            }
        }

        setTimeout(() => {
            const submitBtn = [...document.querySelectorAll('button')].find(b => {
                const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
                return txt === 'submit comment' || txt === 'submit';
            });
            if (submitBtn) triggerClick(submitBtn);
        }, 300);
    }

    function triggerNextStudent() {
        const nextBtn = document.getElementById('next-student-button') ||
            [...document.querySelectorAll('button, a')].find(el => {
                const label = (el.getAttribute('aria-label') || el.title || el.innerText || '').toLowerCase();
                return label.includes('next student');
            });

        if (nextBtn) {
            triggerClick(nextBtn);
            return;
        }
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', code: 'KeyJ', bubbles: true, cancelable: true }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'j', code: 'KeyJ', bubbles: true, cancelable: true }));
    }

    const SCORE_INPUT_SEL = 'input[data-automation="sdk-grading-edit-score-input"], input[role="spinbutton"], input.question_score';
    function isFullCreditBtn(b) { return (b.innerText || b.textContent || '').trim().toLowerCase().includes('award full credit'); }
    function isIncorrectBtn(b) { return (b.innerText || b.textContent || '').trim().toLowerCase().includes('mark as incorrect'); }
    function findEnabledUpdateBtns(doc) {
        return [...doc.querySelectorAll('button, input[type="submit"], a.btn')].filter(b => {
            const txt = (b.innerText || b.textContent || b.value || '').trim().toLowerCase();
            return (txt === 'update' || txt === 'update scores') && !b.disabled && b.getAttribute('aria-disabled') !== 'true';
        });
    }

    let grading = false;

    async function applyAlt1() {
        if (grading) return;
        const doc = getIframeDoc();
        if (!doc) return;
        grading = true;

        const snapshot = dockedState.map(s => ({ img: { ...s.img }, text: { ...s.text } }));
        const imgSnapshot = currentData.map(d => d.imgSrc);
        toggleOverlay(false);
        showToast('Grading Lab 6 (Q1 - Q10)...', 0);

        try {
            const gradeItem = async (qNum, score, isFull) => {
                const c = getQuestionContainer(doc, qNum);
                if (!c) return;
                const fullBtn = [...c.querySelectorAll('button, a')].find(isFullCreditBtn);
                const incorrectBtn = [...c.querySelectorAll('button, a')].find(isIncorrectBtn);
                const input = c.querySelector(SCORE_INPUT_SEL);

                if (isFull && fullBtn) {
                    triggerClick(fullBtn);
                } else if (score === 0 && incorrectBtn) {
                    triggerClick(incorrectBtn);
                } else if (input) {
                    setInputValue(input, score.toString());
                }
                await sleep(150);
            };

            // 1. Grade Q1, Q4, Q7 (DuckDB / SQL verification from previous script)
            for (let q of [1, 4, 7]) {
                const c = getQuestionContainer(doc, q);
                const text = extractAnswerText(c);
                const looksSql = /select\b/i.test(text) && /from\b/i.test(text) && /join\b/i.test(text);
                await gradeItem(q, looksSql ? 1 : 0, looksSql);
            }

            // 2. Grade Rows 0, 1, 2 (Q2/Q3, Q5/Q6, Q8/Q9)
            for (let i = 0; i < 3; i++) {
                const cfg = CARDS[i];
                const state = snapshot[i];

                // Screenshot: 0 if the overlay found none, else full credit or dock 1 pt
                if (!imgSnapshot[i]) await gradeItem(cfg.imgQ, 0, false);
                else if (state.img.docked) await gradeItem(cfg.imgQ, cfg.imgMax - 1, false);
                else await gradeItem(cfg.imgQ, cfg.imgMax, true);

                // Blurb: full credit, or dock 1 pt
                if (state.text.docked) await gradeItem(cfg.textQ, cfg.textMax - 1, false);
                else await gradeItem(cfg.textQ, cfg.textMax, true);
            }

            // 3. Grade Row 3 (Q10: 3 pts)
            const q10State = snapshot[3];
            if (q10State.text.docked) {
                await gradeItem(10, 2, false);
            } else {
                await gradeItem(10, 3, true);
            }

            // Phase 2: Save points
            await sleep(400);
            const updateBtns = findEnabledUpdateBtns(doc);
            if (updateBtns.length) triggerClick(updateBtns[updateBtns.length - 1]);
            await sleep(1000);

            // Phase 3: Post comments
            const comments = snapshot
                .flatMap((s, idx) => [
                    s.img.docked && imgSnapshot[idx] ? `Question ${CARDS[idx].imgQ}: ${s.img.comment}` : null,
                    s.text.docked ? `Question ${CARDS[idx].textQ}: ${s.text.comment}` : null
                ])
                .filter(Boolean)
                .join('\n');

            if (comments) {
                submitComments(comments);
                await sleep(1000);
            }

            // Reset state
            dockedState = freshDock();
            currentData = CARDS.map(() => ({ imgSrc: "", text: "" }));
            for (let i = 0; i < CARDS.length; i++) updateCardState(i);

            // Advance
            showToast('Graded & saved! Moving to next student...', 2000);
            await sleep(2000);
            triggerNextStudent();
        } finally {
            grading = false;
        }
    }

    function handleKeyCommand(e) {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
        if (e.altKey) {
            if (e.code === 'Digit1') { e.preventDefault(); e.stopPropagation(); applyAlt1(); }
            else if (e.code === 'KeyG') { e.preventDefault(); e.stopPropagation(); toggleOverlay(); }
        } else if (e.key === 'Escape') {
            const feedbackOverlay = document.getElementById('sg-feedback-modal-overlay');
            if (!feedbackOverlay) toggleOverlay(false);
        }
    }

    window.addEventListener('keydown', handleKeyCommand, true);
    window.addEventListener('message', (e) => {
        if (e.data?.type === 'SG_HOTKEY') {
            if (e.data.code === 'Digit1') applyAlt1();
            else if (e.data.code === 'KeyG') toggleOverlay();
        }
    });

    // Mark a student done only after a successful scan, so slow-loading uploads get retried (up to ~10 s).
    let lastStudentSrc = '';
    let pendingSrc = '';
    let attempts = 0;
    setInterval(() => {
        const doc = getIframeDoc();
        if (!doc) return;
        const hasQuestions = doc.body && doc.body.innerText.includes('Results for question');
        if (!hasQuestions) return;
        const currentSrc = doc.location.href;
        if (currentSrc === lastStudentSrc) return;
        if (currentSrc !== pendingSrc) { pendingSrc = currentSrc; attempts = 0; }
        if (++attempts > 12) { lastStudentSrc = currentSrc; return; }
        if (scanContent()) {
            lastStudentSrc = currentSrc;
            toggleOverlay(true);
        }
    }, 800);
})();
