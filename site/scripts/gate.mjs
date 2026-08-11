#!/usr/bin/env node
// The site gate: type-check → build → unit tests → e2e, in one command.
//
// Quiet on success — one line per step, carrying the number that proves the
// step actually ran — and loud on failure: the failing step's full output,
// then a non-zero exit. That shape is deliberate. Every run of this gate gets
// re-read by a person or an agent, and the raw commands emit ~320 lines
// between them (`astro check` alone prints ~170 lines of `'z' is deprecated`
// from astro:content). Success needs four numbers; failure needs everything.
//
//   npm run gate                 # all four steps, in order
//   npm run gate -- check build  # only these, in the order listed here
//   npm run gate -- --verbose    # print every step's output, pass or fail
//   npm run gate -- --list       # show the step names and exit
//
// Order matters: `e2e` serves the built site (playwright.config.ts starts
// `astro preview`), so `build` must have run at some point before it.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SITE = fileURLToPath(new URL('..', import.meta.url));
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/** `signal` pulls the one fact worth reporting out of a step that passed. */
const STEPS = [
  {
    name: 'check',
    args: ['run', 'check'],
    signal: (out) => grab(out, /- (\d+) errors?[\s\S]*?- (\d+) warnings?/, (m) => `${m[1]} errors, ${m[2]} warnings`),
  },
  {
    name: 'build',
    args: ['run', 'build'],
    signal: (out) => grab(out, /(\d+) page\(s\) built/, (m) => `${m[1]} pages`),
  },
  {
    name: 'unit',
    args: ['test'],
    signal: (out) => grab(out, /^\s*Tests\s+(.+?)\s*$/m, (m) => m[1]),
  },
  {
    name: 'e2e',
    args: ['run', 'test:e2e'],
    signal: (out) => grab(out, /(\d+) passed/, (m) => `${m[1]} passed`),
  },
];

// Astro and Playwright colorize even when piped, so strip SGR codes before
// matching — otherwise every regex here has to allow for escape sequences.
const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');
const grab = (out, re, format) => {
  const m = stripAnsi(out).match(re);
  return m ? format(m) : 'passed';
};

function run(step) {
  return new Promise((resolve) => {
    const started = Date.now();
    // --silent drops npm's own `> site@0.0.1 check` preamble.
    const child = spawn(NPM, ['--silent', ...step.args], { cwd: SITE, env: process.env });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    const done = (code) => resolve({ code, out, secs: (Date.now() - started) / 1000 });
    child.on('error', (err) => resolve({ code: 1, out: String(err), secs: (Date.now() - started) / 1000 }));
    child.on('close', done);
  });
}

const argv = process.argv.slice(2);
const verbose = argv.includes('--verbose');
const wanted = argv.filter((a) => !a.startsWith('-'));

if (argv.includes('--list') || argv.includes('--help')) {
  console.log(`gate steps: ${STEPS.map((s) => s.name).join(', ')}`);
  process.exit(0);
}

const unknown = wanted.filter((w) => !STEPS.some((s) => s.name === w));
if (unknown.length) {
  console.error(`gate: unknown step(s): ${unknown.join(', ')}`);
  console.error(`gate: known steps are ${STEPS.map((s) => s.name).join(', ')}`);
  process.exit(2);
}

const steps = wanted.length ? STEPS.filter((s) => wanted.includes(s.name)) : STEPS;

if (!existsSync(new URL('../node_modules', import.meta.url))) {
  console.error('gate: node_modules missing — run `npm install` in site/ first.');
  process.exit(2);
}

const totalStart = Date.now();
for (const step of steps) {
  const { code, out, secs } = await run(step);
  const time = `${secs.toFixed(1)}s`;

  if (code !== 0) {
    console.log(`✗ ${step.name.padEnd(6)} failed (exit ${code})`.padEnd(40) + time);
    console.log(`\n${'─'.repeat(70)}\n${out.trimEnd()}\n${'─'.repeat(70)}\n`);
    console.error(`gate: ${step.name} failed`);
    process.exit(1);
  }

  console.log(`✓ ${step.name.padEnd(6)} ${step.signal(out).padEnd(24)}${time}`);
  if (verbose) console.log(`${out.trimEnd()}\n`);
}

console.log(`gate: ${steps.length}/${steps.length} passed in ${((Date.now() - totalStart) / 1000).toFixed(1)}s`);
