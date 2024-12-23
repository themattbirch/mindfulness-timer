import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'), 
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
    logOverride: { 'module level directives cause errors': 'silent' },
  },
  publicDir: 'public',
});
