// ==UserScript==
// @name         3Lab
// @namespace    https://utah.instructure.com/
// @version      2.4
// @description  SpeedGrader 2x2 image grid overlay, point docking with feedback selection, Alt+1 grading, comment submit, and auto-advance.
// @match        *://*.instructure.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Route key events from quiz iframe to top window
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
        "wrong axis scale, numbers are in millions.",
        "wrong axis scale, should start at 0.",
        "wrong axis labels."
    ];

    const QUESTION_LABELS = [
        "Q1: Line Graph (Total Assets)",
        "Q2: Histogram (Net Income)",
        "Q3: Scatter Plot (CA vs. CL)",
        "Q4: Box Plots (Market Value)"
    ];

    let dockedState = [
        { docked: false, comment: "" },
        { docked: false, comment: "" },
        { docked: false, comment: "" },
        { docked: false, comment: "" }
    ];

    let currentImages = ["", "", "", ""];

    // --- Styling ---
    const css = `
        #sg-2x2-overlay {
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
        #sg-2x2-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-bottom: 10px !important;
        }
        #sg-2x2-header h3 {
            margin: 0 !important;
            font-size: 16px !important;
            color: #38bdf8 !important;
        }
        #sg-2x2-header kbd {
            background: #334155 !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            color: #fff !important;
            border: 1px solid #64748b !important;
        }
        #sg-2x2-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: 1fr 1fr !important;
            gap: 12px !important;
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
            padding: 6px 12px !important;
            background: #0f172a !important;
            border-bottom: 1px solid #334155 !important;
            font-size: 13px !important;
            font-weight: 600 !important;
        }
        .sg-badge {
            padding: 2px 8px !important;
            border-radius: 4px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
        }
        .sg-badge.full { background: #065f46 !important; color: #34d399 !important; }
        .sg-badge.docked { background: #7f1d1d !important; color: #fca5a5 !important; }
        .sg-card-img-wrap {
            flex: 1 !important;
            min-height: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
            padding: 6px !important;
        }
        .sg-card-img-wrap img {
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
            display: block !important;
        }
        .sg-card-feedback {
            background: #450a0a !important;
            color: #fca5a5 !important;
            font-size: 12px !important;
            padding: 6px 12px !important;
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
            width: 480px !important;
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

    // Exactly ONE click event: dispatching 'click' AND calling el.click() double-fires
    // (double comment submits, double Update, double next-student).
    function triggerClick(el) {
        if (!el) return;
        const win = el.ownerDocument.defaultView || window;
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: win }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: win }));
        if (typeof el.click === 'function') {
            el.click();
        } else {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: win }));
        }
    }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function setInputValue(input, val) {
        if (!input) return;
        input.focus();
        const win = input.ownerDocument.defaultView || window;
        const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value')?.set
                    || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

        // Reset React's internal valueTracker so it registers the synthetic change
        if (input._valueTracker) {
            input._valueTracker.setValue('');
        }

        if (setter) {
            setter.call(input, val);
        } else {
            input.value = val;
        }

        // No Enter keypress here: the score input treats Enter as "commit", which
        // saved the quiz mid-loop before the later questions were entered.
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
        } catch (e) {
            return null;
        }
    }

    // --- Container & Image Extraction ---
    function getQuestionContainers(doc) {
        if (!doc) return [];

        // 1. Direct New Quizzes SDK wrappers
        const sdkWrappers = [...doc.querySelectorAll('[data-automation="sdk-grading-result-wrapper"]')];
        if (sdkWrappers.length >= 4) {
            return sdkWrappers.slice(0, 4);
        }

        // 2. Fallback: Find parent containers that contain both the question label AND grading controls
        const result = [];
        for (let q = 1; q <= 4; q++) {
            let found = sdkWrappers.find(w => {
                const txt = (w.innerText || '').toLowerCase();
                return txt.includes(`results for question ${q}.`) || txt.includes(`question ${q}.`);
            });

            if (!found) {
                const candidates = [...doc.querySelectorAll('div, section')].filter(el => {
                    const txt = (el.innerText || '').toLowerCase();
                    const hasTitle = txt.includes(`results for question ${q}.`) || txt.includes(`results for question ${q}\n`);
                    if (!hasTitle) return false;

                    const hasBtn = [...el.querySelectorAll('button')].some(b => {
                        const bt = (b.innerText || b.textContent || '').toLowerCase();
                        return bt.includes('award full credit');
                    });
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

    function scanImages() {
        const doc = getIframeDoc();
        if (!doc) return false;

        const containers = getQuestionContainers(doc);
        let imgs = ["", "", "", ""];

        for (let i = 0; i < 4; i++) {
            const c = containers[i];
            if (!c) continue;
            const foundImg = [...c.querySelectorAll('img')].find(img => {
                const s = (img.src || '').toLowerCase();
                return !s.includes('avatar') && !s.includes('icon') && !s.includes('svg');
            });
            if (foundImg && foundImg.src) {
                imgs[i] = foundImg.src;
            } else {
                const link = c.querySelector('a[href*="files"], a[href*="download"]');
                if (link) imgs[i] = link.href;
            }
        }

        if (imgs.filter(Boolean).length < 4) {
            const allUploads = [...doc.querySelectorAll('img')].filter(img => {
                const s = (img.src || '').toLowerCase();
                const a = (img.alt || '').toLowerCase();
                return !s.includes('avatar') && !s.includes('icon') && !s.includes('svg') &&
                       (s.includes('download') || s.includes('files') || s.includes('preview') ||
                        a.includes('.png') || a.includes('.jpg') || a.includes('plot') || a.includes('hist'));
            });
            for (let i = 0; i < 4; i++) {
                if (!imgs[i] && allUploads[i]) imgs[i] = allUploads[i].src;
            }
        }

        if (imgs.filter(Boolean).length > 0) {
            currentImages = imgs;
            updateOverlayCards();
            return true;
        }
        return false;
    }

    // --- Overlay & Feedback Modal ---
    function buildOverlay() {
        if (document.getElementById('sg-2x2-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'sg-2x2-overlay';
        overlay.innerHTML = `
            <div id="sg-2x2-header">
                <h3>Lab 3 - Visualization 2x2 Review</h3>
                <div>
                    Click graph to dock 1 pt & select feedback | Press <kbd>Alt+1</kbd> to grade, submit & advance | <kbd>Esc</kbd> to hide
                </div>
            </div>
            <div id="sg-2x2-grid">
                ${[0, 1, 2, 3].map(i => `
                    <div class="sg-card" data-index="${i}">
                        <div class="sg-card-bar">
                            <span>${QUESTION_LABELS[i]}</span>
                            <span class="sg-badge full">5/5 Full Credit</span>
                        </div>
                        <div class="sg-card-img-wrap">
                            <span style="color:#64748b;font-size:13px;">Waiting for image...</span>
                        </div>
                        <div class="sg-card-feedback" style="display: none;"></div>
                    </div>
                `).join('')}
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelectorAll('.sg-card').forEach(card => {
            card.addEventListener('click', () => {
                const idx = parseInt(card.getAttribute('data-index'), 10);
                openFeedbackModal(idx);
            });
        });
    }

    function updateOverlayCards() {
        buildOverlay();
        for (let i = 0; i < 4; i++) {
            const card = document.querySelector(`.sg-card[data-index="${i}"]`);
            if (!card) continue;
            const wrap = card.querySelector('.sg-card-img-wrap');
            if (currentImages[i]) {
                wrap.innerHTML = `<img src="${currentImages[i]}" alt="Q${i + 1}" />`;
            }
        }
    }

    function toggleOverlay(forceState) {
        buildOverlay();
        const overlay = document.getElementById('sg-2x2-overlay');
        const show = forceState !== undefined ? forceState : (overlay.style.display !== 'flex');
        overlay.style.display = show ? 'flex' : 'none';
        if (show) scanImages();
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
            badge.textContent = '4/5 (-1 pt)';
            feedbackBar.style.display = 'flex';
            feedbackBar.innerHTML = `<span><strong>Docked:</strong> ${state.comment}</span><span style="opacity:0.75;font-size:11px;">(click to edit)</span>`;
        } else {
            card.classList.remove('docked');
            badge.className = 'sg-badge full';
            badge.textContent = '5/5 Full Credit';
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
                    <kbd>C</kbd> <span>Clear penalty (restore 5/5)</span>
                </button>
            `;
        }

        modalOverlay.innerHTML = `
            <div id="sg-feedback-modal">
                <h4>Dock 1 pt: ${QUESTION_LABELS[idx]} <span><kbd>Esc</kbd></span></h4>
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

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) cleanup();
        });

        function handleKey(e) {
            const num = parseInt(e.key, 10);
            if (!isNaN(num) && num >= 1 && num <= FEEDBACK_OPTIONS.length) {
                e.preventDefault();
                e.stopPropagation();
                setReason(FEEDBACK_OPTIONS[num - 1]);
                return;
            }
            if (e.key.toLowerCase() === 'c' && isDocked) {
                e.preventDefault();
                e.stopPropagation();
                clearPenalty();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                cleanup();
            }
        }

        window.addEventListener('keydown', handleKey, true);
    }

    // --- SpeedGrader Submission & Navigation ---
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

    function isFullCreditBtn(b) {
        return (b.innerText || b.textContent || '').trim().toLowerCase().includes('award full credit');
    }

    function findEnabledUpdateBtns(doc) {
        return [...doc.querySelectorAll('button, input[type="submit"], a.btn')].filter(b => {
            const txt = (b.innerText || b.textContent || b.value || '').trim().toLowerCase();
            return (txt === 'update' || txt === 'update scores') &&
                   !b.disabled && b.getAttribute('aria-disabled') !== 'true';
        });
    }

    let grading = false;

    // Phases run strictly in sequence: enter ALL scores -> commit ONCE -> comment -> advance.
    // Nothing inside the per-question loop may commit, or later questions get lost.
    async function applyAlt1() {
        if (grading) return;
        const doc = getIframeDoc();
        if (!doc) return;
        grading = true;

        const snapshot = dockedState.map(s => ({ ...s }));
        toggleOverlay(false);
        showToast('Entering scores...', 0);

        try {
            // Index-based fallbacks, captured before any clicks shift the DOM
            const allFullCreditBtns = [...doc.querySelectorAll('button, a')].filter(isFullCreditBtn);
            const allScoreInputs = [...doc.querySelectorAll(SCORE_INPUT_SEL)];

            // Phase 1: enter every score, commit nothing
            for (let i = 0; i < 4; i++) {
                // Re-query each pass: React re-renders after each change and can detach earlier nodes
                const c = getQuestionContainers(doc)[i];
                const input = (c && c.querySelector(SCORE_INPUT_SEL)) || allScoreInputs[i];

                if (snapshot[i].docked) {
                    if (input) setInputValue(input, '4');
                    else console.warn(`[SG-2x2] Q${i + 1}: no score input found`);
                } else {
                    const fullBtn = (c && [...c.querySelectorAll('button, a')].find(isFullCreditBtn))
                                    || allFullCreditBtns[i];
                    if (fullBtn) triggerClick(fullBtn);
                    else if (input) setInputValue(input, '5');
                    else console.warn(`[SG-2x2] Q${i + 1}: no full-credit button or score input found`);
                }
                await sleep(250);
            }

            // Phase 2: commit all four scores with a single Update click
            await sleep(400);
            const updateBtns = findEnabledUpdateBtns(doc);
            console.log(`[SG-2x2] ${updateBtns.length} enabled Update button(s) found; clicking the last one`);
            if (updateBtns.length) triggerClick(updateBtns[updateBtns.length - 1]);
            else console.warn('[SG-2x2] No Update button found; scores may not be saved');
            await sleep(1000);

            // Phase 3: submit comment in SpeedGrader
            const comments = snapshot
                .map((s, idx) => s.docked && s.comment ? `${QUESTION_LABELS[idx]}: ${s.comment}` : null)
                .filter(Boolean)
                .join('\n');
            if (comments) {
                submitComments(comments);
                await sleep(1000);
            }

            // Reset state for next student
            dockedState = [
                { docked: false, comment: "" },
                { docked: false, comment: "" },
                { docked: false, comment: "" },
                { docked: false, comment: "" }
            ];
            currentImages = ["", "", "", ""];
            for (let i = 0; i < 4; i++) updateCardState(i);

            // Phase 4: advance
            showToast('Graded & submitted! Advancing to next student...', 2000);
            await sleep(2000);
            triggerNextStudent();
        } finally {
            grading = false;
        }
    }

    // --- Hotkeys & Lifecycle ---
    function handleKeyCommand(e) {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) {
            return;
        }

        if (e.altKey) {
            if (e.code === 'Digit1') {
                e.preventDefault();
                e.stopPropagation();
                applyAlt1();
            } else if (e.code === 'KeyG') {
                e.preventDefault();
                e.stopPropagation();
                toggleOverlay();
            }
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

    // Auto-open when new student quiz content renders in the iframe
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
                    const loaded = scanImages();
                    if (loaded) toggleOverlay(true);
                }, 400);
            }
        }
    }, 800);
})();