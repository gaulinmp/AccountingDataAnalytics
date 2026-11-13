// ==UserScript==
// @name         2Lab
// @namespace    https://utah.instructure.com/
// @version      0.4
// @description  SpeedGrader keyboard shortcuts (Alt+1, Alt+2, Alt+3), right-aligned image layout, and numbered quick-comment modal
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const isTop = window === window.top;

    // Quick-comment list (Numbers 1-9)
    const PRESET_COMMENTS = [
        "User IDs weren't fully cleaned.",
        "Missing both Kayla's entries.",
        "Wrong number of journal entries.",
        "Missing pivot table."
    ];

    // Right-aligned docked screenshot previews & comment overlay styling
    const css = `
        .speedgrader-docked-img {
            position: fixed !important;
            z-index: 999999 !important;
            object-fit: contain !important;
            background: #fff !important;
            border: 2px solid #394B58 !important;
            border-radius: 6px !important;
            box-shadow: 0 6px 18px rgba(0,0,0,0.3) !important;
            cursor: zoom-in !important;
            transition: transform 0.1s ease;
        }

        .speedgrader-docked-img:hover {
            z-index: 1000000 !important;
            transform: scale(1.05);
        }

        /* Question 1: Top Right */
        .speedgrader-img-q1 {
            top: 55px !important;
            right: 12px !important;
            max-width: 46vw !important;
            max-height: 42vh !important;
            width: auto !important;
            height: auto !important;
        }

        /* Question 2: Bottom Right */
        .speedgrader-img-q2 {
            top: auto !important;
            bottom: 20px !important;
            right: 12px !important;
            max-width: 46vw !important;
            max-height: 42vh !important;
            width: auto !important;
            height: auto !important;
        }

        /* Comment Picker Modal */
        #sg-comment-modal {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #2D3B45;
            color: #fff;
            padding: 14px 20px;
            border-radius: 8px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            min-width: 420px;
            max-width: 580px;
        }
        #sg-comment-modal h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #00bcd4;
            display: flex;
            justify-content: space-between;
        }
        #sg-comment-modal ol {
            margin: 0;
            padding-left: 20px;
        }
        #sg-comment-modal li {
            margin-bottom: 6px;
            line-height: 1.35;
        }
        #sg-comment-modal kbd {
            background: #445866;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
            color: #fff;
        }
    `;

    function addStyle() {
        const style = document.createElement('style');
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }

    if (document.head || document.documentElement) {
        addStyle();
    } else {
        document.addEventListener('DOMContentLoaded', addStyle);
    }

    // Dock screenshots on the right
    function dockImages() {
        const images = [...document.querySelectorAll('img[src*="media_upload"], img[alt^="Screenshot"]')];
        if (images.length === 0) return;

        images.forEach((img, idx) => {
            img.classList.add('speedgrader-docked-img');
            if (idx === 0) {
                img.classList.remove('speedgrader-img-q2');
                img.classList.add('speedgrader-img-q1');
            } else if (idx === 1) {
                img.classList.remove('speedgrader-img-q1');
                img.classList.add('speedgrader-img-q2');
            }
        });
    }

    const observer = new MutationObserver(() => dockImages());
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
    window.addEventListener('load', dockImages);

    function triggerClick(el) {
        if (!el) return;
        if (typeof el.click === 'function') {
            el.click();
        } else {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }
    }

    function setInputValue(input, val) {
        if (!input) return;
        input.focus();
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (valueSetter) {
            valueSetter.call(input, val);
        } else {
            input.value = val;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
    }

    function getFullCreditButtons() {
        const buttons = [...document.querySelectorAll('button')];
        return buttons.filter(b => {
            const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
            return txt.includes('award full credit') || aria.includes('award full credit');
        });
    }

    function getScoreInputs() {
        return [...document.querySelectorAll('input[data-automation="sdk-grading-edit-score-input"], input[role="spinbutton"]')];
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

        ['keydown', 'keyup'].forEach(type => {
            window.dispatchEvent(new KeyboardEvent(type, {
                key: 'j',
                code: 'KeyJ',
                bubbles: true,
                cancelable: true
            }));
        });
    }

    let isSubmittingComment = false;
    function executeCommentSubmission(text) {
        if (!isTop) return;
        if (isSubmittingComment) return;

        isSubmittingComment = true;
        setTimeout(() => { isSubmittingComment = false; }, 3000);

        let inserted = false;

        // 1. TinyMCE API
        if (window.tinymce) {
            const editor = window.tinymce.get('speedgrader_comment_textarea') || window.tinymce.activeEditor;
            if (editor && !editor.isHidden()) {
                editor.setContent(`<p>${text}</p>`);
                editor.fire('change');
                inserted = true;
            }
        }

        // 2. ContentEditable
        if (!inserted) {
            const editable = document.querySelector('.tox-edit-area, [contenteditable="true"][role="textbox"]');
            if (editable) {
                editable.focus();
                editable.innerHTML = `<p>${text}</p>`;
                editable.dispatchEvent(new Event('input', { bubbles: true }));
                editable.dispatchEvent(new Event('change', { bubbles: true }));
                inserted = true;
            }
        }

        // 3. Textarea
        if (!inserted) {
            const ta = document.getElementById('speedgrader_comment_textarea');
            if (ta) {
                ta.value = text;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                ta.dispatchEvent(new Event('change', { bubbles: true }));
                inserted = true;
            }
        }

        // Submit comment
        setTimeout(() => {
            const buttons = [...document.querySelectorAll('button')];
            const submitBtn = buttons.find(b => {
                const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
                return txt === 'submit comment' || txt === 'submit';
            });
            if (submitBtn) {
                triggerClick(submitBtn);
            }
        }, 200);
    }

    // Top-window comment picker UI
    function showCommentModal() {
        if (!isTop) return;
        const existing = document.getElementById('sg-comment-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'sg-comment-modal';
        
        let listHtml = PRESET_COMMENTS.map((c, i) => `<li><kbd>${i + 1}</kbd> ${c}</li>`).join('');
        modal.innerHTML = `
            <h4>Select Comment <span><kbd>Esc</kbd> to skip</span></h4>
            <ol>${listHtml}</ol>
        `;
        document.body.appendChild(modal);

        function handleModalKey(e) {
            // Check numbers 1-9
            const num = parseInt(e.key, 10);
            if (!isNaN(num) && num >= 1 && num <= PRESET_COMMENTS.length) {
                e.preventDefault();
                e.stopPropagation();
                cleanup();
                executeCommentSubmission(PRESET_COMMENTS[num - 1]);
                setTimeout(() => triggerNextStudent(), 1800);
                return;
            }

            // Esc skips comment
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                cleanup();
                triggerNextStudent();
            }
        }

        function cleanup() {
            window.removeEventListener('keydown', handleModalKey, true);
            modal.remove();
        }

        window.addEventListener('keydown', handleModalKey, true);
    }

    // Top-level message broker
    if (isTop) {
        window.addEventListener('message', (e) => {
            if (e.data?.type === 'AUTOGRADE_NEEDS_COMMENT') {
                showCommentModal();
            } else if (e.data?.type === 'AUTOGRADE_NEXT') {
                setTimeout(() => triggerNextStudent(), 2000);
            }
        });
    }

    function applyGrades(q1FullCredit, q2FullCredit) {
        const fullCreditBtns = getFullCreditButtons();
        const scoreInputs = getScoreInputs();

        // Question 1
        if (q1FullCredit) {
            if (fullCreditBtns[0]) triggerClick(fullCreditBtns[0]);
        } else {
            if (scoreInputs[0]) setInputValue(scoreInputs[0], '4');
        }

        // Question 2
        if (q2FullCredit) {
            if (fullCreditBtns[1]) triggerClick(fullCreditBtns[1]);
        } else {
            if (scoreInputs[1]) setInputValue(scoreInputs[1], '4');
        }

        // Update score
        setTimeout(() => {
            const updateBtns = [...document.querySelectorAll('button')].filter(b => {
                const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
                return txt === 'update';
            });
            const bottomUpdate = updateBtns[updateBtns.length - 1];
            if (bottomUpdate) triggerClick(bottomUpdate);
        }, 300);
    }

    window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) {
            return;
        }

        if (!e.altKey) return;

        // Alt + 1: Q1 Full, Q2 Partial -> Show comment picker
        if (e.code === 'Digit1') {
            e.preventDefault();
            e.stopPropagation();
            applyGrades(true, false);
            if (isTop) showCommentModal();
            else window.top.postMessage({ type: 'AUTOGRADE_NEEDS_COMMENT' }, '*');
        }

        // Alt + 2: Q1 Partial, Q2 Full -> Show comment picker
        if (e.code === 'Digit2') {
            e.preventDefault();
            e.stopPropagation();
            applyGrades(false, true);
            if (isTop) showCommentModal();
            else window.top.postMessage({ type: 'AUTOGRADE_NEEDS_COMMENT' }, '*');
        }

        // Alt + 3: Both Full -> Skip comment picker, advance
        if (e.code === 'Digit3') {
            e.preventDefault();
            e.stopPropagation();
            applyGrades(true, true);
            if (isTop) setTimeout(() => triggerNextStudent(), 2000);
            else window.top.postMessage({ type: 'AUTOGRADE_NEXT' }, '*');
        }
    }, true);
})();
