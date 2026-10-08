import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import vue from '@vitejs/plugin-vue';
import dotenv from 'dotenv';
import immutableAssets from './build/immutable-assets.js';
import { vendorChunks, checkVendorChunk } from './build/vendor-chunk.js';
import latin1Output from './build/latin1-output.js';
import faSubset from './build/fonts.mjs';

// Load base .env first, then environment-specific overrides
dotenv.config({ path: '../../.env' });
// Load .env.production for production builds (overrides base .env)
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '../../.env.production', override: true });
}

export default defineConfig({
  // Escape non-ASCII in the JS and CSS output (with build/latin1-output.js) so Chrome can store the files one byte per char
  esbuild: { charset: 'ascii' },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Vue and Pinia in a stable chunk of their own, so an app edit no longer renames nearly every chunk
        manualChunks: vendorChunks,
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:6667',
        changeOrigin: true,
      },
    },
  },
  worker: {
    format: 'es',
    plugins: [
      environment('all', { prefix: 'CANISTER_' }),
      environment('all', { prefix: 'DFX_' }),
      latin1Output(),
    ],
  },
  plugins: [
    vue(),
    faSubset(),
    environment('all', { prefix: 'CANISTER_' }),
    environment('all', { prefix: 'DFX_' }),
    // assets/ is served as immutable (public/.ic-assets.json5): hash the boot script, guard the names
    immutableAssets(),
    checkVendorChunk(),
    latin1Output(),
  ],
  preview: {
    host: true,
    // SPA fallback - serve index.html for all routes
    proxy: {},
  },
  appType: 'spa',
  resolve: {
    alias: [
      { find: 'declarations', replacement: fileURLToPath(new URL('../declarations', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ]
  }
});
