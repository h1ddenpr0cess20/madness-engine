import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: true, fs: { allow: ['../..'] } },
  build: { target: 'es2022', chunkSizeWarningLimit: 4000 },
});
