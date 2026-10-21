import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative base so the built site works at any URL prefix - the domain
  // root, a GitHub project page at /athar/, or a drive-hosted sub-path.
  // Absolute asset URLs would 404 under a prefix.
  base: './',
  server: { host: '127.0.0.1', port: 5180 },
});
