// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Custom plugin to remove 'use client' directives
function removeUseClient() {
  return {
    name: 'remove-use-client',
    transform(code, id) {
      if (/\.(js|jsx|ts|tsx)$/.test(id)) {
        // Remove 'use client' at the top of the file
        const newCode = code.replace(/^['"]use client['"];\n?/, '');
        if (newCode !== code) {
          return {
            code: newCode,
            map: null, // Provide source maps if needed
          };
        }
      }
      return null;
    },
  };
}

// Vite configuration
export default defineConfig({
  plugins: [
    react(),
    removeUseClient(), // Add the custom plugin here
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  esbuild: {
    logOverride: { 'module level directives cause errors': 'silent' }, // Suppress 'use client' warnings
  },
  publicDir: 'public',
});
