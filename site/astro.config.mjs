// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

// Hosting URL is env-driven (Stage 8). The CI workflow defaults these to the
// GitHub *project site* (https://<owner>.github.io/<repo>) derived from the
// GitHub context, and they can be overridden (repo variables) to point at a
// custom domain. Unset locally → site undefined, base '/' (everything just works
// at the root). Every internal link goes through href()/BASE_URL, so the same
// build is correct at any base. See docs/stages/stage-08-deployment.md.
const SITE = process.env.PUBLIC_SITE || undefined;
const BASE = process.env.PUBLIC_BASE || undefined;

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: SITE,
  base: BASE,
  integrations: [mdx()],
});
