
// ==UserScript==
// @name         2HW
// @namespace    https://utah.instructure.com/
// @version      0.5
// @description  SpeedGrader auto-grading, shortcuts (Alt+1/2/3), compact docked Q3 response badge and live Q9 screenshot preview
// @match        *://*/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Only inject UI in frames containing the quiz content
    function isQuizFrame() {
        return !!document.querySelector('[data-automation="sdk-grading-result-wrapper"]') ||
               document.body?.innerText.includes('Results for question');
    }

    const PRESET_COMMENTS = [
        "Wrong accounts in the filtered table",
        "MEant to be the whole table, not just list of accounts"
    ];

    const css = `
        #sg-docked-container {
            position: fixed !important;
            top: 25px !important;
            right: 14px !important;
            z-index: 2147483646 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            max-width: 64vw !important;
            pointer-events: auto !important;
        }

        #sg-q3-preview-box {
            width: 100% !important;
            box-sizing: border-box !important;
            background: #1e293b !important;
            color: #f8fafc !important;
            padding: 6px 10px !important;
            border-radius: 5px !important;
            border: 1.5px solid #00bcd4 !important;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4) !important;
            margin-bottom: 6px !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            font-size: 12px !important;
            line-height: 1.35 !important;
            max-height: 15vh !important;
            overflow-y: auto !important;
            word-break: break-word !important;
        }

        #sg-q3-preview-box strong {
            color: #00bcd4 !important;
            margin-right: 4px !important;
        }

        #sg-docked-img-el {
            object-fit: contain !important;
            background: #fff !important;
            border: 2px solid #394B58 !important;
            border-radius: 6px !important;
            box-shadow: 0 6px 18px rgba(0,0,0,0.3) !important;
            cursor: zoom-in !important;
            transition: transform 0.1s ease !important;
            max-height: 52vh !important;
            max-width: 100% !important;
            width: auto !important;
            height: auto !important;
            display: block !important;
        }

        #sg-docked-img-el:hover {
            transform: scale(1.03) !important;
        }

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
    addStyle();

    function getQuestionContainer(qNum) {
        const wrappers = [...document.querySelectorAll('[data-automation="sdk-grading-result-wrapper"]')];
        for (const w of wrappers) {
            const txt = (w.innerText || w.textContent || '').toLowerCase();
            if (txt.includes(`results for question ${qNum}.`) || txt.includes(`question ${qNum}.`)) {
                return w;
            }
        }
        return null;
    }

    function extractQ3Text() {
        const q3 = getQuestionContainer(3);
        if (!q3) return '';

        // Canvas renders multiple .user_content blocks: the prompt and the student answer
        const userContentBlocks = [...q3.querySelectorAll('.user_content')];
        for (const block of userContentBlocks) {
            const text = (block.innerText || block.textContent || '').trim();
            const lower = text.toLowerCase();
            // Skip the question prompt instructions
            if (lower.includes('explain in one sentence') || lower.includes('journal entries, provide intuition')) {
                continue;
            }
            if (text.length > 0) {
                return text;
            }
        }

        // Fallback: isolate between the two "Waiting for grade" markers
        const fullText = (q3.innerText || q3.textContent || '').replace(/\r\n/g, '\n');
        const parts = fullText.split(/waiting for grade/i);
        if (parts.length >= 3) {
            const candidate = parts[1].trim();
            if (candidate && !candidate.toLowerCase().includes('explain in one sentence')) {
                return candidate;
            }
        }

        return '';
    }

    function ensureContainer() {
        let container = document.getElementById('sg-docked-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'sg-docked-container';
            document.body.appendChild(container);
        }
        return container;
    }

    let renderedText = null;
    function updateQ3Display(text) {
        if (text === renderedText) return;
        renderedText = text;

        const container = ensureContainer();
        let q3Box = document.getElementById('sg-q3-preview-box');
        if (!q3Box) {
            q3Box = document.createElement('div');
            q3Box.id = 'sg-q3-preview-box';
            container.insertBefore(q3Box, container.firstChild);
        }

        const content = text || '(loading...)';
        q3Box.innerHTML = `<strong>Q3:</strong> ${content}`;
        q3Box.style.display = 'block';
    }

    let currentImgSrc = '';
    function updateDockedImage() {
        const candidates = [...document.querySelectorAll('img')].filter(img => {
            if (img.id === 'sg-docked-img-el') return false;
            if (img.closest('#sg-docked-container')) return false;
            const src = img.src || '';
            const alt = img.alt || '';
            return src.includes('media_upload') || src.includes('download') || alt.startsWith('Screenshot') || img.closest('[data-automation*="question"], section, [data-automation="sdk-grading-result-wrapper"]');
        });

        const latestImg = candidates[candidates.length - 1];
        const container = ensureContainer();
        let previewImg = document.getElementById('sg-docked-img-el');

        if (latestImg && latestImg.src) {
            if (!previewImg) {
                previewImg = document.createElement('img');
                previewImg.id = 'sg-docked-img-el';
                container.appendChild(previewImg);
            }
            if (latestImg.src !== currentImgSrc) {
                currentImgSrc = latestImg.src;
                previewImg.src = latestImg.src;
            }
            previewImg.style.display = 'block';
        } else if (previewImg) {
            previewImg.style.display = 'none';
        }
    }

    let lastKnownQ3 = '';
    function syncFloatingUI() {
        if (!isQuizFrame()) return;

        const q3Text = extractQ3Text();
        if (q3Text && q3Text !== lastKnownQ3) {
            lastKnownQ3 = q3Text;
            updateQ3Display(q3Text);
        } else if (!lastKnownQ3) {
            updateQ3Display('');
        }
        updateDockedImage();
    }

    let debounceTimer = null;
    const observer = new MutationObserver((mutations) => {
        const isSelfMutation = mutations.every(m => m.target && m.target.closest && m.target.closest('#sg-docked-container'));
        if (isSelfMutation) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(syncFloatingUI, 200);
    });

    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    setInterval(syncFloatingUI, 1000);

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
        if (valueSetter) valueSetter.call(input, val);
        else input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
    }

    function getWordCount(container) {
        if (!container) return 0;
        const text = container.innerText || container.textContent || '';
        const match = text.match(/(\d+)\s+words?/i);
        if (match) return parseInt(match[1], 10);
        return 0;
    }

    function awardFullCredit(container) {
        if (!container) return;
        const buttons = [...container.querySelectorAll('button')];
        const fullBtn = buttons.find(b => {
            const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
            return txt.includes('award full credit') || aria.includes('award full credit');
        });

        if (fullBtn) {
            triggerClick(fullBtn);
        } else {
            const input = container.querySelector('input[data-automation="sdk-grading-edit-score-input"], input[role="spinbutton"]');
            if (input) setInputValue(input, '1');
        }
    }

    function setQuestionScore(container, scoreVal) {
        if (!container) return;
        const input = container.querySelector('input[data-automation="sdk-grading-edit-score-input"], input[role="spinbutton"]');
        if (input) setInputValue(input, String(scoreVal));
    }

    function autoGradeQ1AndQ5() {
        const q1 = getQuestionContainer(1);
        if (q1 && getWordCount(q1) > 10) awardFullCredit(q1);

        const q5 = getQuestionContainer(5);
        if (q5 && getWordCount(q5) > 5) awardFullCredit(q5);
    }

    function triggerNextStudent() {
        lastKnownQ3 = '';
        currentImgSrc = '';
        renderedText = null;
        updateQ3Display('');

        // If in iframe, find button in top frame
        const topDoc = window.top.document;
        const nextBtn = topDoc.getElementById('next-student-button') ||
            [...topDoc.querySelectorAll('button, a')].find(el => {
                const label = (el.getAttribute('aria-label') || el.title || el.innerText || '').toLowerCase();
                return label.includes('next student');
            });

        if (nextBtn) {
            triggerClick(nextBtn);
            return;
        }

        ['keydown', 'keyup'].forEach(type => {
            window.top.dispatchEvent(new KeyboardEvent(type, {
                key: 'j',
                code: 'KeyJ',
                bubbles: true,
                cancelable: true
            }));
        });
    }

    let isSubmittingComment = false;
    function executeCommentSubmission(text) {
        if (isSubmittingComment) return;
        isSubmittingComment = true;
        setTimeout(() => { isSubmittingComment = false; }, 3000);

        const topDoc = window.top.document;
        let inserted = false;

        if (window.top.tinymce) {
            const editor = window.top.tinymce.get('speedgrader_comment_textarea') || window.top.tinymce.activeEditor;
            if (editor && !editor.isHidden()) {
                editor.setContent(`<p>${text}</p>`);
                editor.fire('change');
                inserted = true;
            }
        }
        if (!inserted) {
            const editable = topDoc.querySelector('.tox-edit-area, [contenteditable="true"][role="textbox"]');
            if (editable) {
                editable.focus();
                editable.innerHTML = `<p>${text}</p>`;
                editable.dispatchEvent(new Event('input', { bubbles: true }));
                editable.dispatchEvent(new Event('change', { bubbles: true }));
                inserted = true;
            }
        }
        if (!inserted) {
            const ta = topDoc.getElementById('speedgrader_comment_textarea');
            if (ta) {
                ta.value = text;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                ta.dispatchEvent(new Event('change', { bubbles: true }));
                inserted = true;
            }
        }

        setTimeout(() => {
            const buttons = [...topDoc.querySelectorAll('button')];
            const submitBtn = buttons.find(b => {
                const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
                return txt === 'submit comment' || txt === 'submit';
            });
            if (submitBtn) triggerClick(submitBtn);
        }, 250);
    }

    function showCommentModal() {
        const targetDoc = window.top.document;
        const existing = targetDoc.getElementById('sg-comment-modal');
        if (existing) existing.remove();

        const modal = targetDoc.createElement('div');
        modal.id = 'sg-comment-modal';

        let listHtml = PRESET_COMMENTS.map((c, i) => `<li><kbd>${i + 1}</kbd> ${c}</li>`).join('');
        modal.innerHTML = `
            <h4>Select Comment for Question 9 <span><kbd>Esc</kbd> to skip</span></h4>
            <ol>${listHtml}</ol>
        `;
        targetDoc.body.appendChild(modal);

        function handleModalKey(e) {
            const num = parseInt(e.key, 10);
            if (!isNaN(num) && num >= 1 && num <= PRESET_COMMENTS.length) {
                e.preventDefault();
                e.stopPropagation();
                cleanup();
                executeCommentSubmission(PRESET_COMMENTS[num - 1]);
                setTimeout(() => triggerNextStudent(), 2800);
                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                cleanup();
                triggerNextStudent();
            }
        }

        function cleanup() {
            window.top.removeEventListener('keydown', handleModalKey, true);
            window.removeEventListener('keydown', handleModalKey, true);
            modal.remove();
        }

        window.top.addEventListener('keydown', handleModalKey, true);
        window.addEventListener('keydown', handleModalKey, true);
    }

    function applyHomeworkGrading(mode) {
        autoGradeQ1AndQ5();

        const q3 = getQuestionContainer(3);
        const q9 = getQuestionContainer(9);

        if (mode === 'alt1') {
            setQuestionScore(q3, '0');
            awardFullCredit(q9);
        } else if (mode === 'alt2') {
            awardFullCredit(q3);
            setQuestionScore(q9, '1');
        } else if (mode === 'alt3') {
            awardFullCredit(q3);
            awardFullCredit(q9);
        }

        // Click bottom [Update] button in quiz frame
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

        if (e.code === 'Digit1') {
            e.preventDefault();
            e.stopPropagation();
            applyHomeworkGrading('alt1');
            setTimeout(() => triggerNextStudent(), 3000);
        }

        if (e.code === 'Digit2') {
            e.preventDefault();
            e.stopPropagation();
            applyHomeworkGrading('alt2');
            showCommentModal();
        }

        if (e.code === 'Digit3') {
            e.preventDefault();
            e.stopPropagation();
            applyHomeworkGrading('alt3');
            setTimeout(() => triggerNextStudent(), 3000);
        }
    }, true);
})();
