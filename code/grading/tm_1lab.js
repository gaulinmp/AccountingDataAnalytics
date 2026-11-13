
// ==UserScript==
// @name         1Lab
// @namespace    https://utah.instructure.com/
// @version      2.5
// @description  Keyboard shortcuts for Canvas SpeedGrader on Mac
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const isTop = window === window.top;

    // Inject CSS for enlarged screenshot previews
    const css = `
        img[src*="media_upload"],
        img[alt^="Screenshot"] {
            max-width: 950px !important;
            max-height: 650px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            cursor: zoom-in;
            border: 1px solid #d0d0d0;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        div:has(> img[src*="media_upload"]),
        figure:has(> img[src*="media_upload"]) {
            max-width: 100% !important;
            width: fit-content !important;
            height: auto !important;
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

    const CANNED_COMMENT = "In the future, please only screenshot the data, not the surrounding program or window.";
    let isSubmittingComment = false;

    function triggerClick(el) {
        if (!el) return;
        // Native click is sufficient for Canvas buttons; avoid dispatching duplicate synthetic click events
        if (typeof el.click === 'function') {
            el.click();
        } else {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }
    }

    function getFullCreditButtons() {
        const buttons = [...document.querySelectorAll('button')];
        return buttons.filter(b => {
            const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
            return txt.includes('award full credit') || aria.includes('award full credit');
        });
    }

    function executeCommentSubmission(text) {
        if (!isTop) return;
        if (isSubmittingComment) return;

        isSubmittingComment = true;
        setTimeout(() => { isSubmittingComment = false; }, 3000); // 3-second lockout

        let inserted = false;

        // 1. TinyMCE API (Standard SpeedGrader)
        if (window.tinymce) {
            const editor = window.tinymce.get('speedgrader_comment_textarea') || window.tinymce.activeEditor;
            if (editor && !editor.isHidden()) {
                editor.setContent(`<p>${text}</p>`);
                editor.fire('change');
                inserted = true;
            }
        }

        // 2. ContentEditable fallback
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

        // 3. Textarea fallback
        if (!inserted) {
            const ta = document.getElementById('speedgrader_comment_textarea');
            if (ta) {
                ta.value = text;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                ta.dispatchEvent(new Event('change', { bubbles: true }));
                inserted = true;
            }
        }

        // Click the Submit Comment button exactly once
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

    // Listen strictly in top window for requests from subframes
    if (isTop) {
        window.addEventListener('message', (e) => {
            if (e.data?.type === 'INSERT_AUTOGRADE_COMMENT') {
                executeCommentSubmission(e.data.text);
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        // Skip typing in inputs/textareas/contenteditable
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) {
            return;
        }

        const isModifier = e.ctrlKey || e.metaKey || e.altKey;
        if (!isModifier) return;

        // Option/Cmd/Ctrl + 1 -> Q1
        if (e.code === 'Digit1') {
            e.preventDefault();
            const btns = getFullCreditButtons();
            if (btns[0]) triggerClick(btns[0]);
        }

        // Option/Cmd/Ctrl + 2 -> Q2
        if (e.code === 'Digit2') {
            e.preventDefault();
            const btns = getFullCreditButtons();
            if (btns[1]) triggerClick(btns[1]);
        }

        // Option/Cmd/Ctrl + A -> Both + Click bottom Update
        if (e.code === 'KeyA') {
            e.preventDefault();
            const btns = getFullCreditButtons();
            btns.forEach(b => triggerClick(b));

            setTimeout(() => {
                const updateBtns = [...document.querySelectorAll('button')].filter(b => {
                    const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
                    return txt === 'update';
                });
                const bottomUpdate = updateBtns[updateBtns.length - 1];
                if (bottomUpdate) triggerClick(bottomUpdate);
            }, 300);
        }

        // Option + C
        if (e.altKey && e.code === 'KeyC') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            if (isTop) {
                executeCommentSubmission(CANNED_COMMENT);
            } else {
                window.top.postMessage({ type: 'INSERT_AUTOGRADE_COMMENT', text: CANNED_COMMENT }, '*');
            }
        }
    }, true);
})();
