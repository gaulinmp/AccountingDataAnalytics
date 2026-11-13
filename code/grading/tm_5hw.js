// ==UserScript==
// @name         HW4 - Q5 SpeedGrader
// @namespace    https://utah.instructure.com/
// @version      0.2
// @description  SpeedGrader overlay for Q5 pivot table review, point docking, Alt+1 grading, and auto-advance.
// @match        *://*.instructure.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

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

    const MAX_POINTS = 4;
    const DOCKED_POINTS = 3; // -1 pt docking

    const FEEDBACK_OPTIONS = [
        "Period not in Rows or incorrect order.",
        "Missing or incorrect Min/Max aggregation for Effective_Date.",
        "Missing or incorrect Min/Max aggregation for Entered_Date.",
        "Incorrect or missing values in pivot table fields.",
        "Screenshot does not show full table or is illegible."
    ];

    const QUESTION_LABEL = "Q5: Min/Max Effective & Entered Date Pivot Table";
    const TARGET_QUESTIONS = [5];
    const NUM_QUESTIONS = 1;

    let dockedState = [{ docked: false, comment: "" }];
    let currentContent = [""];

    const css = `
        #sg-q5-overlay {
            position: fixed !important;
            inset: 0 !important;
            background: rgba(15, 23, 42, 0.94) !important;
            backdrop-filter: blur(4px) !important;
            z-index: 2147483646 !important;
            display: none;
            flex-direction: column !important;
            padding: 16px !important;
            box-sizing: border-box !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            color: #f8fafc !important;
        }
        #sg-q5-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-bottom: 12px !important;
        }
        #sg-q5-header h3 {
            margin: 0 !important;
            font-size: 16px !important;
            color: #38bdf8 !important;
        }
        #sg-q5-header kbd {
            background: #334155 !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            color: #fff !important;
            border: 1px solid #64748b !important;
        }
        #sg-q5-container {
            display: flex !important;
            flex-direction: column !important;
            flex: 1 !important;
            min-height: 0 !important;
        }
        .sg-card {
            background: #1e293b !important;
            border: 2px solid #334155 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            cursor: pointer !important;
            position: relative !important;
            flex: 1 !important;
            transition: border-color 0.15s ease !important;
        }
        .sg-card:hover { border-color: #38bdf8 !important; }
        .sg-card.docked {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 2px #ef4444 !important;
        }
        .sg-card-bar {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 8px 16px !important;
            background: #0f172a !important;
            border-bottom: 1px solid #334155 !important;
            font-size: 14px !important;
            font-weight: 600 !important;
        }
        .sg-badge {
            padding: 3px 10px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            font-weight: 700 !important;
        }
        .sg-badge.full { background: #065f46 !important; color: #34d399 !important; }
        .sg-badge.docked { background: #7f1d1d !important; color: #fca5a5 !important; }
        .sg-card-content-wrap {
            flex: 1 !important;
            min-height: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
            padding: 10px !important;
            overflow-y: auto !important;
            color: #0f172a !important;
        }
        .sg-card-content-wrap img {
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
            display: block !important;
        }
        .sg-card-feedback {
            background: #450a0a !important;
            color: #fca5a5 !important;
            font-size: 13px !important;
            padding: 8px 16px !important;
            border-top: 1px solid #b91c1c !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        #sg-feedback-modal-overlay {
            position: fixed !important;
            inset: 0 !important;
            background: rgba(0, 0, 0, 0.7) !important;
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
            margin: 0 0 14px 0 !important;
            font-size: 15px !important;
            color: #38bdf8 !important;
            display: flex !important;
            justify-content: space-between !important;
        }
        .sg-opt-btn {
            width: 100% !important;
            background: #334155 !important;
            border: 1px solid #475569 !important;
            color: #fff !important;
            padding: 10px 14px !important;
            border-radius: 6px !important;
            text-align: left !important;
            cursor: pointer !important;
            font-size: 13px !important;
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            margin-bottom: 8px !important;
        }
        .sg-opt-btn:hover { background: #475569 !important; }
        .sg-opt-btn kbd {
            background: #0f172a !important;
            padding: 2px 7px !important;
            border-radius: 4px !important;
            font-weight: 700 !important;
            border: 1px solid #64748b !important;
        }
        .sg-clear-btn { background: #7f1d1d !important; border-color: #991b1b !important; }
        #sg-toast {
            position: fixed !important;
            bottom: 28px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            background: #0284c7 !important;
            color: #fff !important;
            padding: 12px 24px !important;
            border-radius: 6px !important;
            font-weight: 600 !important;
            font-size: 14px !important;
            z-index: 2147483647 !important;
            box-shadow: 0 6px 20px rgba(0,0,0,0.4) !important;
            display: none;
        }
    `;

    function injectCSS() {
        if (document.getElementById('sg-clean-styles')) return;
        const style = document.createElement('style');
        style.id = 'sg-clean-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }
    injectCSS();

    function triggerClick(el) {
        if (!el) return;
        const win = el.ownerDocument.defaultView || window;
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: win }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: win }));
        if (typeof el.click === 'function') el.click();
        else el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: win }));
    }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function setInputValue(input, val) {
        if (!input) return;
        input.focus();
        const win = input.ownerDocument.defaultView || window;
        const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value')?.set
                    || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

        if (input._valueTracker) input._valueTracker.setValue('');
        if (setter) setter.call(input, val);
        else input.value = val;

        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
    }

    function showToast(msg, duration = 4000) {
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

    function getQuestionContainers(doc) {
        if (!doc) return [];
        const sdkWrappers = [...doc.querySelectorAll('[data-automation="sdk-grading-result-wrapper"]')];
        const result = [];

        for (let q of TARGET_QUESTIONS) {
            let found = sdkWrappers.find(w => {
                const txt = (w.innerText || '').toLowerCase();
                return txt.includes(`results for question ${q}.`) || txt.includes(`question ${q}.`);
            });

            if (!found) {
                const candidates = [...doc.querySelectorAll('div, section')].filter(el => {
                    const txt = (el.innerText || '').toLowerCase();
                    const hasTitle = txt.includes(`results for question ${q}.`) || txt.includes(`results for question ${q}\n`);
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
            result.push(found || null);
        }
        return result;
    }

    function scanContent() {
        const doc = getIframeDoc();
        if (!doc) return false;

        const containers = getQuestionContainers(doc);
        let data = [""];
        const c = containers[0];

        if (c) {
            const foundImg = [...c.querySelectorAll('img')].find(img => {
                const s = (img.src || '').toLowerCase();
                return !s.includes('avatar') && !s.includes('icon') && !s.includes('svg');
            });
            if (foundImg && foundImg.src) {
                data[0] = foundImg.src;
            } else {
                const link = c.querySelector('a[href*="files"], a[href*="download"]');
                if (link) data[0] = link.href;
            }
        }

        // Fallback search in document
        if (!data[0]) {
            const candidateImg = [...doc.querySelectorAll('img')].find(img => {
                const s = (img.src || '').toLowerCase();
                const a = (img.alt || '').toLowerCase();
                return !s.includes('avatar') && !s.includes('icon') && !s.includes('svg') &&
                       (s.includes('download') || s.includes('files') || s.includes('preview') ||
                        a.includes('.png') || a.includes('.jpg') || a.includes('pivot') || a.includes('period'));
            });
            if (candidateImg) data[0] = candidateImg.src;
        }

        if (data[0]) {
            currentContent = data;
            updateOverlayCards();
            return true;
        }
        return false;
    }

    function buildOverlay() {
        if (document.getElementById('sg-q5-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'sg-q5-overlay';
        overlay.innerHTML = `
            <div id="sg-q5-header">
                <h3>Homework 4 - Single Review (${QUESTION_LABEL})</h3>
                <div>
                    Click graph to dock 1 pt | <kbd>Alt+1</kbd> to grade, submit & advance | <kbd>Esc</kbd> to hide
                </div>
            </div>
            <div id="sg-q5-container">
                <div class="sg-card" data-index="0">
                    <div class="sg-card-bar">
                        <span>${QUESTION_LABEL}</span>
                        <span class="sg-badge full">${MAX_POINTS}/${MAX_POINTS} Full Credit</span>
                    </div>
                    <div class="sg-card-content-wrap">
                        <span style="color:#64748b;font-size:13px;">Waiting for content...</span>
                    </div>
                    <div class="sg-card-feedback" style="display: none;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const card = overlay.querySelector('.sg-card[data-index="0"]');
        card.addEventListener('click', () => {
            openFeedbackModal(0);
        });
    }

    function updateOverlayCards() {
        buildOverlay();
        const card = document.querySelector('.sg-card[data-index="0"]');
        if (!card) return;
        const wrap = card.querySelector('.sg-card-content-wrap');
        if (currentContent[0]) {
            wrap.innerHTML = `<img src="${currentContent[0]}" alt="Q5" />`;
        }
    }

    function toggleOverlay(forceState) {
        buildOverlay();
        const overlay = document.getElementById('sg-q5-overlay');
        const show = forceState !== undefined ? forceState : (overlay.style.display !== 'flex');
        overlay.style.display = show ? 'flex' : 'none';
        if (show) scanContent();
    }

    function updateCardState(idx) {
        const card = document.querySelector(`.sg-card[data-index="${idx}"]`);
        if (!card) return;
        const state = dockedState[idx];
        const badge = card.querySelector('.sg-badge');
        const feedbackBar = card.querySelector('.sg-card-feedback');

        if (state.docked) {
            card.classList.add('docked');
            badge.className = 'sg-badge docked';
            badge.textContent = `${DOCKED_POINTS}/${MAX_POINTS} (-1 pt)`;
            feedbackBar.style.display = 'flex';
            feedbackBar.innerHTML = `<span><strong>Docked:</strong> ${state.comment}</span><span style="opacity:0.75;font-size:11px;">(click to edit)</span>`;
        } else {
            card.classList.remove('docked');
            badge.className = 'sg-badge full';
            badge.textContent = `${MAX_POINTS}/${MAX_POINTS} Full Credit`;
            feedbackBar.style.display = 'none';
            feedbackBar.textContent = '';
        }
    }

    function openFeedbackModal(idx) {
        const existing = document.getElementById('sg-feedback-modal-overlay');
        if (existing) existing.remove();

        const isDocked = dockedState[idx].docked;
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
                    <kbd>C</kbd> <span>Clear penalty (restore ${MAX_POINTS}/${MAX_POINTS})</span>
                </button>
            `;
        }

        modalOverlay.innerHTML = `
            <div id="sg-feedback-modal">
                <h4>Dock 1 pt: ${QUESTION_LABEL} <span><kbd>Esc</kbd></span></h4>
                <div>${buttons}</div>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        function cleanup() {
            window.removeEventListener('keydown', handleKey, true);
            modalOverlay.remove();
        }

        function setReason(txt) {
            dockedState[idx].docked = true;
            dockedState[idx].comment = txt;
            updateCardState(idx);
            cleanup();
        }

        function clearPenalty() {
            dockedState[idx].docked = false;
            dockedState[idx].comment = "";
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

        const snapshot = dockedState.map(s => ({ ...s }));
        toggleOverlay(false);
        showToast('Entering Q5 score...', 0);

        try {
            const containers = getQuestionContainers(doc);
            const c = containers[0];
            const input = c ? c.querySelector(SCORE_INPUT_SEL) : null;
            const fullBtn = c ? [...c.querySelectorAll('button, a')].find(isFullCreditBtn) : null;

            // Phase 1: Enter score for Q5 (4 pts max)
            if (snapshot[0].docked) {
                if (input) setInputValue(input, String(DOCKED_POINTS));
                else console.warn('[SG-Q5] Q5: no score input found');
            } else {
                if (fullBtn) triggerClick(fullBtn);
                else if (input) setInputValue(input, String(MAX_POINTS));
                else console.warn('[SG-Q5] Q5: no full-credit button or score input found');
            }
            await sleep(250);

            // Phase 2: Commit scores via Update button
            await sleep(400);
            const updateBtns = findEnabledUpdateBtns(doc);
            if (updateBtns.length) triggerClick(updateBtns[updateBtns.length - 1]);
            else console.warn('[SG-Q5] No Update button found');
            await sleep(1000);

            // Phase 3: Submit feedback comment if docked
            if (snapshot[0].docked && snapshot[0].comment) {
                submitComments(`Q5: ${snapshot[0].comment}`);
                await sleep(1000);
            }

            // Reset local state
            dockedState = [{ docked: false, comment: "" }];
            currentContent = [""];
            updateCardState(0);

            // Phase 4: Advance
            showToast('Graded & submitted! Advancing to next student...', 2000);
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

    let lastStudentSrc = '';
    setInterval(() => {
        const doc = getIframeDoc();
        if (!doc) return;
        const hasQuestions = doc.body && doc.body.innerText.includes('Results for question');
        if (hasQuestions) {
            const currentSrc = doc.location.href;
            if (currentSrc !== lastStudentSrc) {
                lastStudentSrc = currentSrc;
                setTimeout(() => {
                    const loaded = scanContent();
                    if (loaded) toggleOverlay(true);
                }, 400);
            }
        }
    }, 800);
})();
