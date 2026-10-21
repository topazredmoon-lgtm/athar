import { defineConfig } from 'vite';

/**
 * Builds `studio/athar-hf/engine.js` — the Athar engine as one plain IIFE
 * script, for the HyperFrames composition (no bundler, no React on that page).
 */
export default defineConfig({
  build: {
    outDir: 'studio/athar-hf',
    emptyOutDir: false,
    lib: {
      entry: 'studio/entry.ts',
      name: 'AtharEngine',
      formats: ['iife'],
      fileName: () => 'engine.js',
    },
    rollupOptions: {
      output: { extend: true },
    },
    target: 'es2022',
    minify: true,
  },
});
