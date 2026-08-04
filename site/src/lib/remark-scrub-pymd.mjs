// Labs/homework instructions under ../labs_hw are authored for the course's
// python-markdown pipeline (convert_md.py), which supports a few extensions
// that remark renders literally: `[TOC]` placeholders and `{: .class}`
// attr-list markers. This plugin scrubs those artifacts so the same source
// files render cleanly on the site. It runs on all markdown, but the patterns
// are specific enough not to occur in deck MDX.
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export default function remarkScrubPymd() {
  return (tree, file) => scrub(tree, file.path ? dirname(file.path) : null);
}

const ATTR_LIST = /\{:[^}]*\}/g;
const REMOTE = /^(https?:)?\//;

function scrub(node, dir) {
  if (!node.children) return;
  node.children = node.children.filter((child) => {
    scrub(child, dir);
    // Drop a paragraph that is just a `[TOC]` placeholder. Remark parses the
    // bare bracket text as a shortcut linkReference to "TOC".
    if (child.type === 'paragraph' && child.children?.length === 1) {
      const only = child.children[0];
      if (only.type === 'linkReference' && /^toc$/i.test(only.identifier ?? '')) return false;
      if (only.type === 'text' && only.value.trim() === '[TOC]') return false;
    }
    // Drop images whose file is missing on disk — Astro hard-fails the build
    // when it can't resolve a relative markdown image, and the labs_hw sources
    // occasionally reference screenshots that were never committed.
    if (child.type === 'image' && dir && !REMOTE.test(child.url) && !existsSync(resolve(dir, child.url))) {
      child.type = 'text';
      child.value = `[figure not yet available: ${child.alt || child.url}]`;
      delete child.url;
      delete child.children;
    }
    return true;
  });
  for (const child of node.children) {
    if (child.type === 'text' && ATTR_LIST.test(child.value)) {
      child.value = child.value.replace(ATTR_LIST, '').trimEnd();
    }
  }
}
