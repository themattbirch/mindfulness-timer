// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'), // Frontend entry point
        background: resolve(__dirname, 'src/background/background.ts'), // Background script entry point
      },
      output: {
        entryFileNames: '[name].js', // Outputs as popup.js and background.js
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: 'dist',
    emptyOutDir: true, // Cleans the dist/ folder before building
  },
  esbuild: {
    logOverride: { 'module level directives cause errors': 'silent' },
  },
  publicDir: 'public',
});
