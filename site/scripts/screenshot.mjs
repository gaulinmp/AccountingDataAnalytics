#!/usr/bin/env node
// Screenshot pages of the site — for eyeballing a visual change without
// clicking through the browser, and for showing an agent what its CSS did.
//
//   npm run screenshot                                   # the home page
//   npm run screenshot -- / /week-04/ /week-03/slides/   # several pages
//   npm run screenshot -- / --preview=2026-09-08         # simulate a date
//   npm run screenshot -- / --full                       # whole page, not just the fold
//   npm run screenshot -- / --selector=".site-header"    # just one element
//
// Flags: --preview=<all|YYYY-MM-DD|off>  --out=<dir>  --width=  --height=
//        --full  --selector=<css>  --wait=<ms>  --url=<base>
//
// The server: if something already answers on the base URL (`npm run dev` or
// `npm run preview`), it is used as-is. Otherwise this builds if needed, starts
// `astro preview` itself, and shuts it down on the way out — so the command
// works from a cold checkout with no setup.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const SITE = fileURLToPath(new URL('..', import.meta.url));
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const argv = process.argv.slice(2);
if (argv.includes('--help')) {
  console.log(new URL(import.meta.url).pathname);
  console.log('usage: npm run screenshot -- [paths…] [--preview=DATE|all] [--out=dir]');
  console.log('       [--width=N] [--height=N] [--full] [--selector=CSS] [--wait=MS] [--url=BASE]');
  process.exit(0);
}

const flag = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const paths = argv.filter((a) => !a.startsWith('-'));
const pages = paths.length ? paths : ['/'];
const base = flag('url', 'http://localhost:4321');
const preview = flag('preview', null);
const outDir = flag('out', new URL('../.screenshots/', import.meta.url).pathname);
const width = Number(flag('width', 1280));
const height = Number(flag('height', 900));
const settle = Number(flag('wait', 300));
const selector = flag('selector', null);
const fullPage = argv.includes('--full');

const alive = async (url) => {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
};

/** Start `astro preview` (building first if there is nothing to serve) and
 *  resolve once it answers. Returns a stop() the caller must run. */
async function startServer() {
  if (!existsSync(new URL('../dist/index.html', import.meta.url))) {
    console.log('screenshot: no dist/ yet — building…');
    await new Promise((resolve, reject) => {
      const build = spawn(NPM, ['--silent', 'run', 'build'], { cwd: SITE, stdio: 'inherit' });
      build.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`build failed (exit ${code})`))));
    });
  }

  const server = spawn(NPM, ['--silent', 'run', 'preview'], { cwd: SITE, stdio: 'ignore', detached: false });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await alive(base)) return () => server.kill();
    await new Promise((r) => setTimeout(r, 400));
  }
  server.kill();
  throw new Error(`screenshot: ${base} never came up`);
}

/** /week-03/slides/?slide=9 → week-03-slides-slide-9 (bare "/" → home). */
const slug = (path) => {
  const cleaned = path.replace(/[?=&]/g, '-').replace(/[^a-zA-Z0-9/_-]/g, '');
  const name = cleaned.split('/').filter(Boolean).join('-').replace(/-+/g, '-');
  return name || 'home';
};

const target = (path) => {
  const url = new URL(path, base);
  if (preview) url.searchParams.set('preview', preview);
  return url.toString();
};

mkdirSync(outDir, { recursive: true });

const usingOwnServer = !(await alive(base));
const stop = usingOwnServer ? await startServer() : () => {};
if (!usingOwnServer) console.log(`screenshot: using the server already on ${base}`);

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  for (const path of pages) {
    const url = target(path);
    await page.goto(url, { waitUntil: 'networkidle' });
    // The week gate, quiz state, and the deck controller all run on load;
    // give them a beat before the shutter.
    await page.waitForTimeout(settle);

    const file = `${outDir.replace(/\/$/, '')}/${slug(path)}${preview ? `@${preview}` : ''}.png`;
    const shooter = selector ? page.locator(selector).first() : page;
    await shooter.screenshot({ path: file, ...(selector ? {} : { fullPage }) });
    console.log(`✓ ${url}\n  → ${file}`);
  }

  await context.close();
} finally {
  await browser.close();
  stop();
}
