import { defineConfig } from 'vitest/config';

// Unit tests only. We match `*.test.ts` so Playwright's `*.spec.ts` e2e files
// are NOT picked up by Vitest (the two runners share the tests/ dir).
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@components': new URL('./src/components/', import.meta.url).pathname,
      '@layout': new URL('./src/components/layout/', import.meta.url).pathname,
      '@islands': new URL('./src/components/islands/', import.meta.url).pathname,
      '@lib': new URL('./src/lib/', import.meta.url).pathname,
      '@styles': new URL('./src/styles/', import.meta.url).pathname,
    },
  },
});
