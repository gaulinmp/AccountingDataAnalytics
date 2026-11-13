// ==UserScript==
// @name         #[Lab|HW]
// @namespace    https://utah.instructure.com/
// @version      1.0
// @description  SpeedGrader (New Quizzes) grading template: edit CONFIG, everything below it is reusable plumbing.
// @match        *://*.instructure.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * HOW TO USE
 *   Tampermonkey: copy this file, edit CONFIG (and @name), enable ONLY this script for the assignment.
 *   Browser agent: run the whole file in the SpeedGrader tab (top frame) with javascript_tool. Re-running
 *     it is safe: the previous copy tears itself down first. Then:
 *       SG.describe()            -> frames, student, and every question found (number, text, image, inputs)
 *       SG.readAnswers()         -> { q: {text, imgSrc, words, blocks} } for the configured questions
 *       await SG.applyGrades({1: 1, 2: 3.5}, 'Question 2: ...')   -> enter, commit, comment (no advance)
 *       await SG.next()          -> next student
 *       await SG.applyAndNext()  -> what Alt+1 does: apply the panel's scores/comments, then advance
 *   Only the CONFIG block should need glue code. Use SG.escapeHtml on student text in custom render()s.
 *
 * SPEEDGRADER QUIRKS (learned over labs 1-7; every one of these bit at least once)
 *   1. Frames. The top window owns Next Student, the comment box (TinyMCE) and the student_id in the URL.
 *      The New Quizzes results (answers, "Award full credit", score inputs, Update) live in a nested
 *      iframe, sometimes more than one level down. querySelector and innerText do not cross frames.
 *   2. Tampermonkey runs the script in EVERY matching frame. If each frame builds UI you get duplicate
 *      overlays, double Update clicks and double comments. Exactly one frame owns the UI: see ownsUI().
 *   3. Re-running a pasted script stacks setIntervals and listeners (duplicate overlays again), so
 *      install() tears down any previous copy. Paste mode also listens for keys in the quiz frame, but
 *      userscript mode must not: the quiz frame's own copy already routes them (double handling).
 *   4. React inputs ignore `el.value = x`. Use the native setter, reset _valueTracker, fire input+change.
 *   5. Never send Enter to a score input: Enter commits the quiz mid-loop and later questions are lost.
 *   6. Strict phases: enter ALL scores -> click Update ONCE (the last enabled one) -> comment -> next.
 *      Re-query each question container right before using it; React re-renders detach old nodes.
 *   7. Max and zero go through "Award full credit" / "Mark as incorrect"; partial credit goes in the input.
 *   8. One click per click: el.click() exactly once. Dispatching 'click' AND calling el.click() double-fires.
 *   9. Answer text sits between two copies of the status label ("Waiting for grade" / "Graded" /
 *      "Incorrect" / "Correct"); test Incorrect before Correct. Read innerText from the live node: a
 *      detached clone has no layout, so it loses its line breaks.
 *  10. Match "results for question N." including the period, or Q1 matches Q10.
 *  11. Content (especially uploads) renders late. Poll, wait until the scan is stable, retry ~10 s.
 *      Key state by student so a table built for one student can never be applied to the next.
 *  12. If a question can't be found, or there's no enabled Update button: stop and don't advance.
 *  13. Hotkeys: match e.code ('Digit1'), not e.key (Option+1 on a Mac is '¡'). Keys pressed inside the
 *      quiz frame never reach the top window; they have to be routed with postMessage.
 *  14. No alert/confirm/prompt: they block the page and the browser agent. Use toast()/status().
 *  15. Every grading script @matches every Canvas page and they used to share message types; namespace
 *      DOM ids and messages with CONFIG.id and keep only one script enabled at a time.
 *  16. Student text goes into innerHTML, so escape it.
 */

(function () {
    'use strict';

    // =====================================================================================
    // CONFIG: the only part that should change per assignment
    // =====================================================================================
    const CONFIG = {
        id: 'template',               // namespaces DOM ids + messages; make it unique per script
        title: 'SpeedGrader Helper',
        layout: 'panel',              // 'panel' (docked on the right) | 'overlay' (full-screen grid)
        columns: 2,                   // overlay grid columns
        autoOpen: true,               // show the UI as each student loads
        autoAdvanceWhenPerfect: false,// every row at max on load -> apply and advance with no review
        skipGraded: false,            // every row already graded on load -> advance without touching anything
        dockPoints: 1,                // what one pick from the feedback list takes off
        scanRetries: 12,              // ticks (800 ms) to wait for late content before showing what's there

        // Numbered picker shown when you click a card (keys 1-9). A question's own `feedback` overrides.
        feedback: [
            "Missing required columns, I can't tell if it worked",
            "Doesn't match the requested output",
        ],

        // Extra line(s) for the comment, or null. rows = { q: {score, comment} }.
        generalComment: (rows) => null,

        // Return false to stay idle on other assignments (e.g. check the quiz title in quizDoc.body.innerText).
        isTarget: (quizDoc) => true,

        // q:        question number as New Quizzes shows it ("Results for question N.")
        // max:      points possible (the full-credit button awards Canvas's max, keep them in sync)
        // show:     'text' | 'image' | 'both' | 'none'
        // auto:     (answer, answers) -> number | {score, comment}; omitted -> manual, defaults to max.
        //           answer = {q, text, imgSrc, words, blocks, el}. A blank answer defaults to 0.
        // derive:   (scores) -> number: a real quiz question whose score is computed from the other rows;
        //           follows their edits until typed over
        // highlight: RegExp whose matches are bolded in the text view
        // render:   (answer) -> trusted HTML for the content area (escape student text with SG.escapeHtml)
        questions: [
            { q: 1, max: 1, label: 'SQL query', show: 'text', highlight: /\b(SELECT|FROM|JOIN|ON|WHERE)\b/gi,
              auto: (a) => (/select\b/i.test(a.text) && /from\b/i.test(a.text) ? 1 : 0) },
            { q: 2, max: 4, label: 'Screenshot', show: 'image' },
            { q: 3, max: 2, label: 'Explanation', show: 'text' },
            { q: 4, max: 3, label: 'Completion: 1 + 2 × share of Q1-Q3', show: 'none',
              derive: (s) => 1 + 2 * ((s[1] || 0) + (s[2] || 0) + (s[3] || 0)) / 7 },
        ],
    };

    // =====================================================================================
    // Install / teardown
    // =====================================================================================
    const NS = 'sgt:' + CONFIG.id;          // postMessage namespace
    const PFX = 'sgt-' + CONFIG.id;         // DOM id prefix
    const KEY = '__SGT_' + CONFIG.id;       // window slot holding the live copy
    const IS_TOP = window === window.top;
    const IS_USERSCRIPT = typeof GM_info !== 'undefined';

    try { window[KEY]?.teardown(); } catch (e) { /* previous copy already gone */ }

    const cleanups = [];
    function on(target, type, fn, opts) {
        target.addEventListener(type, fn, opts);
        cleanups.push(() => target.removeEventListener(type, fn, opts));
    }
    function every(ms, fn) {
        const id = setInterval(fn, ms);
        cleanups.push(() => clearInterval(id));
    }
    function teardown() {
        cleanups.splice(0).forEach(f => { try { f(); } catch (e) { /* ignore */ } });
        document.querySelectorAll('[id^="' + PFX + '"]').forEach(n => n.remove());
    }

    // =====================================================================================
    // Small helpers
    // =====================================================================================
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const round2 = (x) => Number(Number(x).toFixed(2));
    const log = (...a) => console.log('[' + CONFIG.id + ']', ...a);

    function escapeHtml(str) {
        return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Resolves to fn()'s first truthy value, or null after `timeout` ms.
    async function waitFor(fn, timeout = 3000, interval = 100) {
        const end = Date.now() + timeout;
        while (Date.now() < end) {
            try { const v = fn(); if (v) return v; } catch (e) { /* not ready */ }
            await sleep(interval);
        }
        return null;
    }

    function getElementByXPath(xpath, doc = document) {
        try {
            return doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } catch (e) { return null; }
    }

    function triggerClick(el) {
        if (!el) return;
        const win = el.ownerDocument?.defaultView || window;
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: win }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: win }));
        if (typeof el.click === 'function') el.click();
        else el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: win }));
    }

    // React-controlled inputs ignore a plain `.value =`; go through the native setter of the
    // element's own window (it may live in another frame). No Enter: it commits the quiz.
    function setInputValue(el, val) {
        if (!el) return;
        el.focus();
        const win = el.ownerDocument?.defaultView || window;
        const proto = el.tagName === 'TEXTAREA' ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (el._valueTracker) el._valueTracker.setValue('');
        if (setter) setter.call(el, val);
        else el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.blur();
    }

    // =====================================================================================
    // Frames
    // =====================================================================================
    function sameOriginDoc(win) {
        try { return win.document; } catch (e) { return null; }
    }
    const TOP_DOC = sameOriginDoc(window.top);   // null when top is cross-origin from this frame

    function hasQuizResults(doc) {
        return !!(doc && doc.body) &&
            (!!doc.querySelector('[data-automation="sdk-grading-result-wrapper"]') ||
             (doc.body.innerText || '').includes('Results for question'));
    }

    // Depth-first over every frame under `win`. win.frames is readable cross-origin; .document is not.
    function findQuizDoc(win = window) {
        const doc = sameOriginDoc(win);
        if (hasQuizResults(doc)) return doc;
        for (let i = 0; i < win.frames.length; i++) {
            try {
                const found = findQuizDoc(win.frames[i]);
                if (found) return found;
            } catch (e) { /* frame went away */ }
        }
        return null;
    }

    // Exactly one frame owns the UI. Top owns it whenever it can reach the quiz doc (full-screen
    // overlay, direct access to comments and Next). Only when the quiz frame is cross-origin from top
    // does the quiz frame itself own it, and then top-only actions go through callTop().
    function ownsUI() {
        if (IS_TOP) return !!findQuizDoc(window);
        return !TOP_DOC && hasQuizResults(document);
    }

    function getQuizDoc() {
        return IS_TOP ? findQuizDoc(window) : (hasQuizResults(document) ? document : null);
    }

    function studentKey(quizDoc) {
        const href = TOP_DOC ? TOP_DOC.location.href : '';
        const m = decodeURIComponent(href).match(/student_id["':=\s]+"?(\d+)/);
        return m ? 'student:' + m[1] : (quizDoc?.location.href || href);
    }

    // Post to every descendant frame; frames/length/postMessage are allowed even cross-origin.
    function broadcastDown(win, msg) {
        for (let i = 0; i < win.frames.length; i++) {
            try {
                win.frames[i].postMessage(msg, '*');
                broadcastDown(win.frames[i], msg);
            } catch (e) { /* frame went away */ }
        }
    }

    function isCanvasOrigin(origin) {
        try { return /(^|\.)instructure\.com$/.test(new URL(origin).hostname); } catch (e) { return false; }
    }

    // =====================================================================================
    // Quiz frame: finding questions and reading answers
    // =====================================================================================
    const SCORE_INPUT_SEL = 'input[data-automation="sdk-grading-edit-score-input"], input[role="spinbutton"], input.question_score';
    const STATUS_MARKERS = ['Waiting for grade', 'Graded', 'Incorrect', 'Correct'];

    // Visible label first (exact-match checks like 'update' rely on it), aria-label only as a fallback.
    function btnText(b) {
        return (b.innerText || b.textContent || b.value || b.getAttribute('aria-label') || '').trim().toLowerCase();
    }
    function findButtons(root, pred) {
        return [...root.querySelectorAll('button, a, input[type="submit"]')].filter(b => pred(btnText(b), b));
    }
    const ariaHas = (b, s) => (b.getAttribute('aria-label') || '').toLowerCase().includes(s);
    const isFullCreditBtn = (t, b) => t.includes('award full credit') || ariaHas(b, 'award full credit');
    const isIncorrectBtn = (t, b) => t.includes('mark as incorrect') || ariaHas(b, 'mark as incorrect');

    // { q: wrapperEl } for every result wrapper whose heading names its question number.
    function listQuestions(doc) {
        const out = {};
        for (const w of doc.querySelectorAll('[data-automation="sdk-grading-result-wrapper"]')) {
            const m = (w.innerText || '').match(/results for question (\d+)\./i) || (w.innerText || '').match(/question (\d+)\./i);
            if (m && !out[m[1]]) out[m[1]] = w;
        }
        return out;
    }

    function getQuestionContainer(doc, qNum) {
        if (!doc) return null;
        const found = listQuestions(doc)[qNum];
        if (found) return found;
        // Fallback: the smallest block naming the question that also holds grading controls.
        const candidates = [...doc.querySelectorAll('div, section')].filter(el => {
            const txt = (el.innerText || '').toLowerCase();
            if (!txt.includes(`results for question ${qNum}.`) && !txt.includes(`results for question ${qNum}\n`)) return false;
            return findButtons(el, isFullCreditBtn).length > 0 || !!el.querySelector(SCORE_INPUT_SEL);
        });
        candidates.sort((a, b) => (a.innerText?.length || 0) - (b.innerText?.length || 0));
        return candidates[0] || null;
    }

    function extractAnswerText(container) {
        if (!container) return '';
        const text = container.innerText || '';
        for (const marker of STATUS_MARKERS) {
            const start = text.indexOf(marker);
            const end = text.lastIndexOf(marker);
            if (start !== -1 && end > start) return text.slice(start + marker.length, end).trim();
        }
        return '';
    }

    // Canvas renders the prompt and the answer as separate .user_content blocks.
    function extractUserContent(container) {
        if (!container) return [];
        return [...container.querySelectorAll('.user_content')].map(b => (b.innerText || '').trim()).filter(Boolean);
    }

    function isUploadImg(img) {
        const s = (img.src || '').toLowerCase();
        return s && !s.includes('avatar') && !s.includes('icon') && !s.includes('svg');
    }

    // Any non-icon <img>, else a files/download link.
    function extractImageSrc(container) {
        if (!container) return '';
        const img = [...container.querySelectorAll('img')].find(isUploadImg);
        if (img) return img.src;
        const link = container.querySelector('a[href*="files"], a[href*="download"]');
        return link ? link.href : '';
    }

    function extractWordCount(container) {
        const m = (container?.innerText || '').match(/(\d+)\s+words?\b/i);
        return m ? parseInt(m[1], 10) : 0;
    }

    function readCurrentScore(container) {
        const v = parseFloat(container?.querySelector(SCORE_INPUT_SEL)?.value);
        return isNaN(v) ? null : v;
    }

    // Ungraded manual questions say "Waiting for grade" and "N points possible"; graded ones show "x / N points".
    function readGrade(container) {
        const text = container?.innerText || '';
        if (!container || text.includes('Waiting for grade')) return null;
        const header = text.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*\d+(?:\.\d+)?\s*points?\b/m);
        return readCurrentScore(container) ?? (header ? parseFloat(header[1]) : null);
    }

    function readAnswer(doc, q) {
        const el = getQuestionContainer(doc, q);
        const blocks = extractUserContent(el);
        const grade = readGrade(el);
        return {
            q, el, grade,
            found: !!el,
            graded: grade !== null,
            text: extractAnswerText(el) || blocks.slice(1).join('\n\n'),
            imgSrc: extractImageSrc(el),
            words: extractWordCount(el),
            blocks,
        };
    }

    function scan(doc) {
        const answers = {};
        for (const qc of CONFIG.questions) if (!qc.derive) answers[qc.q] = readAnswer(doc, qc.q);

        // Uploads sometimes sit outside their wrapper: hand out page-order uploads to image rows still missing one.
        const needImg = CONFIG.questions.filter(qc => /image|both/.test(qc.show || '') && answers[qc.q] && !answers[qc.q].imgSrc);
        if (needImg.length) {
            const claimed = new Set(Object.values(answers).map(a => a.imgSrc).filter(Boolean));
            const uploads = [...doc.querySelectorAll('img')].filter(img => {
                const s = (img.src || '').toLowerCase();
                return isUploadImg(img) && !claimed.has(img.src) && /download|files|preview/.test(s);
            });
            needImg.forEach((qc, i) => { if (uploads[i]) answers[qc.q].imgSrc = uploads[i].src; });
        }
        return answers;
    }

    // =====================================================================================
    // Quiz frame: writing scores
    // =====================================================================================
    function setScore(container, score, max) {
        if (!container) return false;
        const full = findButtons(container, isFullCreditBtn)[0];
        const zero = findButtons(container, isIncorrectBtn)[0];
        const input = container.querySelector(SCORE_INPUT_SEL);
        if (score >= max && full) { triggerClick(full); return true; }
        if (score === 0 && zero) { triggerClick(zero); return true; }
        if (input) { setInputValue(input, String(score)); return true; }
        return false;
    }

    function findEnabledUpdateBtns(doc) {
        return findButtons(doc, (t, b) => (t === 'update' || t === 'update scores') &&
            !b.disabled && b.getAttribute('aria-disabled') !== 'true');
    }

    async function commitScores(doc) {
        const btn = await waitFor(() => findEnabledUpdateBtns(doc).at(-1), 3000);
        if (!btn) return false;
        triggerClick(btn);
        return true;
    }

    // =====================================================================================
    // Top frame: comments and navigation (callTop() reaches these from any frame)
    // =====================================================================================
    let commentBusy = false;

    async function submitComment(text) {
        if (!text) return { ok: true };
        if (commentBusy) return { ok: false, error: 'a comment is already being submitted' };
        commentBusy = true;
        try {
            const html = text.split('\n').map(l => '<p>' + escapeHtml(l) + '</p>').join('');
            let inserted = false;
            const ed = window.tinymce?.get('speedgrader_comment_textarea') || window.tinymce?.activeEditor;
            if (ed && !ed.isHidden()) {
                ed.setContent(html);
                ed.fire('change');
                ed.save?.();
                inserted = true;
            }
            if (!inserted) {
                const editable = document.querySelector('.tox-edit-area [contenteditable="true"], [contenteditable="true"][role="textbox"]');
                if (editable) {
                    editable.focus();
                    editable.innerHTML = html;
                    editable.dispatchEvent(new Event('input', { bubbles: true }));
                    editable.dispatchEvent(new Event('change', { bubbles: true }));
                    inserted = true;
                }
            }
            if (!inserted) {
                const ta = document.getElementById('speedgrader_comment_textarea');
                if (ta) { setInputValue(ta, text); inserted = true; }
            }
            if (!inserted) return { ok: false, error: 'comment box not found' };

            await sleep(300);
            const submit = document.getElementById('comment_submit_button') ||
                findButtons(document, t => t === 'submit comment' || t === 'submit')[0];
            if (!submit) return { ok: false, error: 'Submit comment button not found' };
            triggerClick(submit);
            await sleep(800);
            return { ok: true };
        } finally {
            commentBusy = false;
        }
    }

    function nextStudent() {
        const btn = document.getElementById('next-student-button') ||
            [...document.querySelectorAll('button, a')].find(el =>
                (el.getAttribute('aria-label') || el.title || el.innerText || '').toLowerCase().includes('next student'));
        if (btn) { triggerClick(btn); return { ok: true, via: 'button' }; }
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', code: 'KeyJ', bubbles: true, cancelable: true }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'j', code: 'KeyJ', bubbles: true, cancelable: true }));
        return { ok: true, via: 'j key' };
    }

    const TOP_ACTIONS = {
        comment: (m) => submitComment(m.text),
        next: () => nextStudent(),
        url: () => ({ ok: true, href: location.href }),
    };

    const pending = new Map();
    let rpcSeq = 0;

    function callTop(type, payload = {}) {
        if (IS_TOP) return Promise.resolve(TOP_ACTIONS[type](payload));
        return new Promise(resolve => {
            const id = ++rpcSeq;
            pending.set(id, resolve);
            window.top.postMessage({ ns: NS, type, id, ...payload }, '*');
            setTimeout(() => {
                if (pending.delete(id)) resolve({ ok: false, error: 'no reply from top frame (script not running there?)' });
            }, 8000);
        });
    }

    on(window, 'message', async (e) => {
        const m = e.data;
        if (!m || m.ns !== NS || !isCanvasOrigin(e.origin)) return;
        if (m.type === 'reply') {
            pending.get(m.id)?.(m.result);
            pending.delete(m.id);
        } else if (m.type === 'hotkey') {
            if (ownsUI()) HOTKEYS[m.code]?.();
        } else if (IS_TOP && TOP_ACTIONS[m.type]) {
            const result = await TOP_ACTIONS[m.type](m);
            e.source?.postMessage({ ns: NS, type: 'reply', id: m.id, result }, '*');
        }
    });

    // =====================================================================================
    // Grading state
    // =====================================================================================
    // state = { key, answers: {q: answer}, rows: {q: {score, comment, overridden, error}} }
    let state = null;

    const qcfg = (q) => CONFIG.questions.find(c => String(c.q) === String(q));
    const isBlank = (a) => !a || (!a.text && !a.imgSrc);

    function initialRows(answers) {
        const rows = {};
        for (const qc of CONFIG.questions) {
            if (qc.derive) continue;
            const a = answers[qc.q];
            let r, error = '';
            if (a?.graded) r = { score: a.grade };   // keep the existing grade rather than re-deriving it
            else try { r = qc.auto ? qc.auto(a, answers) : undefined; } catch (err) { error = 'auto() threw: ' + err.message; }
            if (typeof r === 'number') r = { score: r };
            const fallback = isBlank(a) ? 0 : qc.max;
            rows[qc.q] = { score: round2(r?.score ?? fallback), comment: r?.comment || '', error };
        }
        recomputeDerived(rows);
        return rows;
    }

    function recomputeDerived(rows) {
        const scores = Object.fromEntries(Object.entries(rows).map(([q, r]) => [q, r.score]));
        for (const qc of CONFIG.questions) {
            if (!qc.derive || rows[qc.q]?.overridden) continue;
            rows[qc.q] = { comment: rows[qc.q]?.comment || '', score: round2(qc.derive(scores)) };
        }
    }

    const currentScores = () => Object.fromEntries(Object.entries(state.rows).map(([q, r]) => [q, r.score]));

    function composeComment(rows) {
        const lines = CONFIG.questions
            .filter(qc => rows[qc.q]?.comment)
            .map(qc => `Question ${qc.q}: ${rows[qc.q].comment}`);
        const extra = CONFIG.generalComment?.(rows);
        if (extra) lines.push(extra);
        return lines.join('\n');
    }

    const isPerfect = () => !!state && CONFIG.questions.every(qc =>
        state.answers[qc.q]?.found !== false && !state.rows[qc.q]?.error && state.rows[qc.q]?.score >= qc.max);

    const gradedQs = () => CONFIG.questions.filter(qc => state?.answers[qc.q]?.graded);
    const isAllGraded = () => !!state && gradedQs().length === CONFIG.questions.filter(qc => !qc.derive).length;

    // Scores that differ from what Canvas already has. Re-awarding an unchanged grade leaves Update
    // disabled, which applyGrades would (rightly) treat as a failure.
    function changedScores() {
        return Object.fromEntries(Object.entries(currentScores()).filter(([q, s]) => {
            const a = state.answers[q];
            return !(a?.graded && round2(a.grade) === round2(s));
        }));
    }

    // Phase 1 enter every score -> phase 2 one Update -> phase 3 comment. Returns false (and says why)
    // on anything unexpected; callers must not advance then.
    async function applyGrades(scores, comment = '') {
        const doc = getQuizDoc();
        if (!doc) return fail('Quiz results not found.');

        const missing = [];
        for (const [q, score] of Object.entries(scores)) {
            const qc = qcfg(q);
            const c = getQuestionContainer(doc, q);   // re-query: React detaches nodes after each change
            if (!c || !setScore(c, Number(score), qc ? qc.max : Infinity)) missing.push(q);
            await sleep(200);
        }
        if (missing.length) return fail('Could not set Q' + missing.join(', Q') + ' — not committing or advancing.');

        if (Object.keys(scores).length) {
            await sleep(400);
            if (!(await commitScores(doc))) return fail('No enabled Update button — scores NOT saved, not advancing.');
            await sleep(1500);
        }

        if (comment) {
            const r = await callTop('comment', { text: comment });
            if (!r?.ok) return fail('Scores saved, but the comment failed (' + (r?.error || '?') + ') — not advancing.');
        }
        return true;
    }

    function fail(msg) {
        console.warn('[' + CONFIG.id + ']', msg);
        status(msg);
        toast(msg, 5000);
        return false;
    }

    let busy = false;
    let lastAppliedKey = null;   // the old student stays on screen until Next loads; never rebuild it

    async function applyAndNext() {
        if (busy) return false;
        busy = true;
        try {
            const doc = getQuizDoc();
            if (!state || !doc) return fail('Nothing scanned yet.');
            if (studentKey(doc) !== state.key) {
                state = null;
                render();
                return fail('Student changed since this table was built — rescanning, nothing applied.');
            }
            toast('Applying scores…', 0);
            if (!(await applyGrades(changedScores(), composeComment(state.rows)))) return false;
            toast('Saved. Next student…', 1500);
            lastAppliedKey = state.key;
            state = null;
            render();
            await sleep(600);
            await callTop('next');
            return true;
        } finally {
            busy = false;
        }
    }

    async function skip(msg = 'Skipped. Next student…') {
        if (busy || !state) return false;
        toast(msg, 1500);
        lastAppliedKey = state.key;
        state = null;
        render();
        await callTop('next');
        return true;
    }

    // =====================================================================================
    // UI (built only in the owning frame)
    // =====================================================================================
    const CSS = `
        #${PFX}-root { position: fixed; z-index: 2147483646; display: none; flex-direction: column; box-sizing: border-box;
            background: #0f172a; color: #e2e8f0; font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        #${PFX}-root.sgt-panel { top: 60px; right: 16px; width: 640px; max-width: calc(100vw - 32px); max-height: calc(100vh - 80px);
            border: 2px solid #334155; border-radius: 8px; box-shadow: 0 8px 28px rgba(0,0,0,.45); }
        #${PFX}-root.sgt-overlay { inset: 0; background: rgba(15,23,42,.5); padding: 12px 16px; }
        #${PFX}-root.sgt-shown { display: flex; }
        #${PFX}-root * { box-sizing: border-box; }
        #${PFX}-root .sgt-head { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; padding: 8px 10px; border-bottom: 1px solid #334155; }
        #${PFX}-root .sgt-head h3 { margin: 0; font-size: 14px; color: #38bdf8; }
        #${PFX}-root .sgt-actions { display: flex; gap: 8px; }
        #${PFX}-root .sgt-total { font-weight: 700; justify-self: end; }
        #${PFX}-root button { font: inherit; cursor: pointer; border-radius: 4px; border: 1px solid #475569; background: #334155; color: #fff; padding: 3px 9px; }
        #${PFX}-root button.sgt-go { background: #15803d; border-color: #16a34a; font-weight: 700; }
        #${PFX}-root kbd { background: #1e293b; border: 1px solid #64748b; border-radius: 3px; padding: 0 4px; font-size: 11px; }
        #${PFX}-root .sgt-status { color: #fbbf24; font-size: 12px; padding: 0 10px; min-height: 0; }
        #${PFX}-root .sgt-status:not(:empty) { padding: 4px 10px; }
        #${PFX}-root .sgt-body { overflow: auto; padding: 8px; display: grid; gap: 8px; flex: 1; min-height: 0; }
        #${PFX}-root.sgt-overlay .sgt-body { grid-template-columns: repeat(${CONFIG.columns}, minmax(0, 1fr)); grid-auto-rows: minmax(0, 1fr); }
        #${PFX}-root .sgt-card { background: #1e293b; border: 1.5px solid #334155; border-radius: 6px; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
        #${PFX}-root .sgt-card.sgt-docked { border-color: #ef4444; }
        #${PFX}-root .sgt-bar { display: flex; gap: 8px; align-items: center; padding: 4px 8px; background: #0b1120; font-weight: 600; }
        #${PFX}-root .sgt-bar .sgt-label { flex: 1; }
        #${PFX}-root .sgt-flag { color: #f87171; font-size: 11px; font-weight: 700; }
        #${PFX}-root input.sgt-in { width: 58px; padding: 1px 4px; font-weight: 700; background: #0f172a; border: 1px solid #475569; border-radius: 3px; }
        #${PFX}-root input.sgt-in.full { color: #34d399; } #${PFX}-root input.sgt-in.part { color: #fbbf24; } #${PFX}-root input.sgt-in.zero { color: #f87171; }
        #${PFX}-root .sgt-content { flex: 1; min-height: 0; overflow: auto; cursor: pointer; display: flex; gap: 8px; padding: 6px 8px; }
        #${PFX}-root .sgt-content:hover { background: #172033; }
        #${PFX}-root .sgt-text { margin: 0; flex: 1; white-space: pre-wrap; word-break: break-word; font: 12px/1.45 ui-monospace, Menlo, Consolas, monospace; color: #cbd5e1; }
        #${PFX}-root .sgt-img { flex: 3; min-width: 0; } #${PFX}-root .sgt-img img { width: 100%; height: auto; display: block; }
        #${PFX}-root .sgt-none { color: #f87171; font-style: italic; }
        #${PFX}-root input.sgt-comment { margin: 0 8px 6px; padding: 3px 6px; background: #0f172a; color: #fca5a5; border: 1px solid #334155; border-radius: 3px; font: inherit; font-size: 12px; }
        #${PFX}-pick { position: fixed; inset: 0; z-index: 2147483647; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center;
            font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        #${PFX}-pick .sgt-box { background: #1e293b; color: #f8fafc; border: 1.5px solid #475569; border-radius: 8px; padding: 16px 20px; width: 500px; max-width: 92vw; }
        #${PFX}-pick h4 { margin: 0 0 10px; color: #38bdf8; font-size: 14px; }
        #${PFX}-pick button { display: flex; gap: 10px; width: 100%; text-align: left; margin-bottom: 6px; padding: 7px 10px; font: inherit;
            background: #334155; color: #fff; border: 1px solid #475569; border-radius: 5px; cursor: pointer; }
        #${PFX}-pick button:hover { background: #475569; } #${PFX}-pick button.sgt-clear { background: #7f1d1d; border-color: #991b1b; }
        #${PFX}-pick kbd { background: #0f172a; border: 1px solid #64748b; border-radius: 3px; padding: 0 5px; font-weight: 700; }
        #${PFX}-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 2147483647; display: none;
            background: #0284c7; color: #fff; padding: 9px 18px; border-radius: 6px; font: 600 13px -apple-system, sans-serif; box-shadow: 0 6px 20px rgba(0,0,0,.4); }
    `;

    let dismissed = false;   // closed with ×: stay closed (also across students) until Alt+G

    function ensureRoot() {
        let root = document.getElementById(PFX + '-root');
        if (root) return root;
        if (!document.getElementById(PFX + '-css')) {
            const style = document.createElement('style');
            style.id = PFX + '-css';
            style.textContent = CSS;
            document.head.appendChild(style);
        }
        root = document.createElement('div');
        root.id = PFX + '-root';
        root.className = CONFIG.layout === 'overlay' ? 'sgt-overlay' : 'sgt-panel';
        root.innerHTML = `
            <div class="sgt-head">
                <h3>${escapeHtml(CONFIG.title)}</h3>
                <div class="sgt-actions">
                    <button data-act="rescan" title="Re-read the answers">Rescan</button>
                    <button data-act="skip" title="Alt+2: next student without saving">Skip <kbd>⌥2</kbd></button>
                    <button data-act="apply" class="sgt-go" title="Alt+1">Apply &amp; Next <kbd>⌥1</kbd></button>
                    <button data-act="close" title="Close (Alt+G reopens)">&times;</button>
                </div>
                <span class="sgt-total"></span>
            </div>
            <div class="sgt-status"></div>
            <div class="sgt-body"></div>`;
        document.body.appendChild(root);

        root.querySelector('[data-act="rescan"]').onclick = () => { state = null; tick(true); };
        root.querySelector('[data-act="apply"]').onclick = () => applyAndNext();
        root.querySelector('[data-act="skip"]').onclick = () => skip();
        root.querySelector('[data-act="close"]').onclick = () => { dismissed = true; show(false); };

        // Event delegation: the body is re-rendered for every student.
        const body = root.querySelector('.sgt-body');
        body.addEventListener('input', (e) => {
            const q = e.target.dataset.q;
            if (!state || !q) return;
            if (e.target.classList.contains('sgt-in')) {
                const v = parseFloat(e.target.value);
                state.rows[q].score = isNaN(v) ? 0 : v;
                if (qcfg(q)?.derive) state.rows[q].overridden = true;
                else recomputeDerived(state.rows);
                refreshScores();
            } else if (e.target.classList.contains('sgt-comment')) {
                state.rows[q].comment = e.target.value;
                refreshScores();
            }
        });
        // Not an inline onerror: Canvas's CSP can block inline handlers. 'error' doesn't bubble, so capture.
        body.addEventListener('error', (e) => {
            if (e.target.tagName !== 'IMG') return;
            const a = document.createElement('a');
            a.href = e.target.src;
            a.target = '_blank';
            a.textContent = 'Image failed to load: open file';
            e.target.replaceWith(a);
        }, true);
        body.addEventListener('click', (e) => {
            const content = e.target.closest('.sgt-content');
            if (content && !e.target.closest('a')) openPicker(content.dataset.q);
        });
        return root;
    }

    function show(on) {
        const root = ensureRoot();
        root.classList.toggle('sgt-shown', on);
        if (on) dismissed = false;
    }
    const isShown = () => !!document.getElementById(PFX + '-root')?.classList.contains('sgt-shown');

    function status(msg) {
        const el = document.getElementById(PFX + '-root')?.querySelector('.sgt-status');
        if (el) el.textContent = msg || '';
    }

    function toast(msg, duration = 3000) {
        let t = document.getElementById(PFX + '-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = PFX + '-toast';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.display = 'block';
        clearTimeout(t._timer);
        if (duration > 0) t._timer = setTimeout(() => { t.style.display = 'none'; }, duration);
    }

    function textHtml(text, highlight) {
        let html = escapeHtml(text);
        // Bold after escaping, so the student's text can't inject markup.
        if (highlight) html = html.replace(new RegExp(highlight.source, highlight.flags.includes('g') ? highlight.flags : highlight.flags + 'g'), '<b>$&</b>');
        return `<pre class="sgt-text">${html}</pre>`;
    }

    function contentHtml(qc, a) {
        if (qc.render) return qc.render(a);
        if (!qc.show || qc.show === 'none') return '';
        if (!a?.found) return `<span class="sgt-none">Question ${qc.q} not found on the page</span>`;
        const parts = [];
        if (/image|both/.test(qc.show)) {
            parts.push(a.imgSrc
                ? `<div class="sgt-img"><img src="${escapeHtml(a.imgSrc)}" alt="Q${qc.q} upload"></div>`
                : `<span class="sgt-none">No image found</span>`);
        }
        if (/text|both/.test(qc.show)) {
            parts.push(a.text ? textHtml(a.text, qc.highlight) : `<span class="sgt-none">No text answer found</span>`);
        }
        return parts.join('');
    }

    function render() {
        const root = ensureRoot();
        const body = root.querySelector('.sgt-body');
        status('');
        if (!state) {
            body.innerHTML = '<div style="padding:8px;color:#64748b;">Waiting for quiz results…</div>';
            root.querySelector('.sgt-total').textContent = '';
            return;
        }
        body.innerHTML = CONFIG.questions.map(qc => {
            const a = state.answers[qc.q];
            const r = state.rows[qc.q];
            const flags = [r.error, a && !a.found ? 'NOT FOUND' : '', a?.graded ? `GRADED ${a.grade}` : '']
                .filter(Boolean).map(escapeHtml).join(' · ');
            const content = contentHtml(qc, a);
            return `
                <div class="sgt-card" data-q="${qc.q}">
                    <div class="sgt-bar">
                        <span class="sgt-label">Q${qc.q}${qc.label ? ' · ' + escapeHtml(qc.label) : ''}</span>
                        <span class="sgt-flag">${flags}</span>
                        <span><input type="number" class="sgt-in" data-q="${qc.q}" value="${r.score}" step="1" min="0" max="${qc.max}"> / ${qc.max}</span>
                    </div>
                    ${content ? `<div class="sgt-content" data-q="${qc.q}" title="Click to dock points">${content}</div>` : ''}
                    ${qc.derive ? '' : `<input class="sgt-comment" data-q="${qc.q}" placeholder="Comment (posted as “Question ${qc.q}: …”)" value="${escapeHtml(r.comment)}">`}
                </div>`;
        }).join('');
        refreshScores();
        const n = gradedQs().length;
        if (n) status(`${isAllGraded() ? 'Already graded' : `Partly graded (${n}/${CONFIG.questions.length})`}: ` +
            'scores below are the saved ones; Apply only commits changes. ⌥2 skips.');
    }

    // Colors, derived values and the total, without re-rendering (keeps focus in the input being typed in).
    function refreshScores() {
        const root = document.getElementById(PFX + '-root');
        if (!root || !state) return;
        let total = 0, max = 0;
        for (const qc of CONFIG.questions) {
            const r = state.rows[qc.q];
            const inp = root.querySelector(`.sgt-in[data-q="${qc.q}"]`);
            if (inp && qc.derive && !r.overridden && inp !== document.activeElement) inp.value = r.score;
            inp?.classList.remove('full', 'part', 'zero');
            inp?.classList.add(r.score >= qc.max ? 'full' : r.score > 0 ? 'part' : 'zero');
            root.querySelector(`.sgt-card[data-q="${qc.q}"]`)?.classList.toggle('sgt-docked', r.score < qc.max || !!r.comment);
            const cm = root.querySelector(`.sgt-comment[data-q="${qc.q}"]`);
            if (cm && cm !== document.activeElement) cm.value = r.comment;
            total += r.score;
            max += qc.max;
        }
        root.querySelector('.sgt-total').textContent = `${round2(total)} / ${max}`;
    }

    function openPicker(q) {
        const qc = qcfg(q);
        if (!state || !qc || qc.derive) return;
        document.getElementById(PFX + '-pick')?.remove();
        const options = qc.feedback || CONFIG.feedback;
        const r = state.rows[q];
        const docked = r.score < qc.max || !!r.comment;

        const pick = document.createElement('div');
        pick.id = PFX + '-pick';
        pick.innerHTML = `
            <div class="sgt-box">
                <h4>Q${qc.q}: dock ${CONFIG.dockPoints} pt <span style="float:right;"><kbd>Esc</kbd></span></h4>
                ${options.slice(0, 9).map((opt, i) => `<button data-i="${i}"><kbd>${i + 1}</kbd><span>${escapeHtml(opt)}</span></button>`).join('')}
                ${docked ? `<button class="sgt-clear" data-act="clear"><kbd>C</kbd><span>Clear: full credit, no comment</span></button>` : ''}
            </div>`;
        document.body.appendChild(pick);

        const choose = (i) => {
            r.score = Math.max(0, round2(qc.max - CONFIG.dockPoints));
            r.comment = options[i];
            done();
        };
        const clear = () => { r.score = qc.max; r.comment = ''; done(); };
        const close = () => { window.removeEventListener('keydown', onKey, true); pick.remove(); };
        function done() { recomputeDerived(state.rows); refreshScores(); close(); }
        function onKey(e) {
            const n = parseInt(e.key, 10);
            if (n >= 1 && n <= Math.min(9, options.length)) choose(n - 1);
            else if (e.key.toLowerCase() === 'c' && docked) clear();
            else if (e.key === 'Escape') close();
            else return;
            e.preventDefault();
            e.stopPropagation();
        }
        pick.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (b?.dataset.act === 'clear') clear();
            else if (b) choose(Number(b.dataset.i));
            else if (e.target === pick) close();
        });
        window.addEventListener('keydown', onKey, true);
    }

    // =====================================================================================
    // Hotkeys
    // =====================================================================================
    const HOTKEYS = {
        Digit1: () => applyAndNext(),
        Digit2: () => skip(),
        KeyG: () => show(!isShown()),
    };

    function routeHotkey(code) {
        if (ownsUI()) return HOTKEYS[code]();
        const msg = { ns: NS, type: 'hotkey', code };
        try { window.top.postMessage(msg, '*'); } catch (e) { /* ignore */ }
        broadcastDown(window.top, msg);
    }

    function onKeydown(e) {
        const doc = e.currentTarget.document || document;
        const active = doc.activeElement;
        const inOurUI = !!active?.closest?.('#' + PFX + '-root');
        const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(active?.tagName) || active?.isContentEditable;
        if (typing && !inOurUI) return;
        if (e.altKey && HOTKEYS[e.code]) {
            e.preventDefault();
            e.stopPropagation();
            routeHotkey(e.code);
        } else if (e.key === 'Escape' && CONFIG.layout === 'overlay' && isShown() && !document.getElementById(PFX + '-pick')) {
            show(false);
        }
    }
    on(window, 'keydown', onKeydown, true);

    // Paste mode only: there is no copy of the script in the quiz frame, so listen there directly.
    const keyedWindows = new WeakSet();
    function listenInQuizFrame(quizDoc) {
        if (IS_USERSCRIPT) return;
        const w = quizDoc.defaultView;
        if (!w || w === window || keyedWindows.has(w)) return;
        keyedWindows.add(w);
        on(w, 'keydown', onKeydown, true);
    }

    // =====================================================================================
    // Student watcher: rebuild state when a new student renders, once the content is stable
    // =====================================================================================
    let pendingKey = null, attempts = 0, lastSig = '';

    function tick(force = false) {
        if (!ownsUI()) return;   // non-owner frames only route hotkeys and serve callTop()
        const doc = getQuizDoc();
        if (!doc || !CONFIG.isTarget(doc)) return;
        listenInQuizFrame(doc);

        const key = studentKey(doc);
        if (!force && ((state && state.key === key) || key === lastAppliedKey)) return;
        if (key !== pendingKey) { pendingKey = key; attempts = 0; lastSig = ''; }

        const answers = scan(doc);
        const list = Object.values(answers);
        const sig = list.map(a => `${a.found}|${a.text.length}|${a.imgSrc}`).join(';');
        const stable = sig === lastSig && list.every(a => a.found) && list.some(a => !isBlank(a));
        lastSig = sig;
        if (!force && !stable && ++attempts < CONFIG.scanRetries) return;

        state = { key, answers, rows: initialRows(answers) };
        render();
        if (CONFIG.autoOpen && !dismissed) show(true);
        log('scanned', key, currentScores());
        if (isAllGraded()) {
            if (CONFIG.skipGraded) skip('Already graded — skipping…');
        } else if (CONFIG.autoAdvanceWhenPerfect && isPerfect()) {
            toast('Full credit on everything — applying & advancing…', 2000);
            applyAndNext();
        }
    }
    every(800, () => tick());

    // =====================================================================================
    // Public API (for the browser agent / console)
    // =====================================================================================
    function describe() {
        const doc = getQuizDoc();
        const questions = doc ? Object.entries(listQuestions(doc)).map(([q, el]) => {
            const a = readAnswer(doc, q);
            const maxGuess = (el.innerText.match(/(\d+(?:\.\d+)?)\s*(?:pts?|points?)\b/i) || [])[1];
            return {
                q: Number(q),
                configured: !!qcfg(q),
                maxGuess: maxGuess ? Number(maxGuess) : null,
                currentScore: readCurrentScore(el),
                hasFullCreditBtn: findButtons(el, isFullCreditBtn).length > 0,
                hasScoreInput: !!el.querySelector(SCORE_INPUT_SEL),
                words: a.words,
                imgSrc: a.imgSrc,
                text: a.text.slice(0, 300),
            };
        }) : [];
        return {
            id: CONFIG.id,
            frame: IS_TOP ? 'top' : 'child',
            mode: IS_USERSCRIPT ? 'userscript' : 'paste',
            ownsUI: ownsUI(),
            topSameOrigin: !!TOP_DOC,
            quizDocFound: !!doc,
            quizHref: doc?.location.href || null,
            student: doc ? studentKey(doc) : null,
            updateButtonsEnabled: doc ? findEnabledUpdateBtns(doc).length : 0,
            hint: doc ? '' : 'No same-origin frame with quiz results. If the quiz frame is cross-origin, install as a userscript instead of pasting.',
            questions,
        };
    }

    function readAnswers() {
        const doc = getQuizDoc();
        if (!doc) return null;
        const answers = scan(doc);
        return Object.fromEntries(Object.entries(answers).map(([q, { el, ...rest }]) => [q, rest]));
    }

    const api = {
        CONFIG, describe, readAnswers, applyGrades, applyAndNext, teardown,
        next: () => callTop('next'),
        comment: (text) => callTop('comment', { text }),
        rescan: () => { state = null; tick(true); return state && currentScores(); },
        state: () => state,
        show: () => show(true),
        hide: () => show(false),
        // Building blocks for glue code
        getQuizDoc, findQuizDoc, listQuestions, getQuestionContainer, readAnswer, extractAnswerText,
        extractUserContent, extractImageSrc, extractWordCount, readCurrentScore, setScore, commitScores,
        findEnabledUpdateBtns, submitComment, nextStudent, callTop, triggerClick, setInputValue, waitFor,
        getElementByXPath, escapeHtml, sleep, toast,
    };
    window[KEY] = api;
    window.SG = api;
    log('loaded in', IS_TOP ? 'top' : 'child', 'frame,', IS_USERSCRIPT ? 'userscript' : 'paste', 'mode');
})();
