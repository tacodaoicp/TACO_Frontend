import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import vue from '@vitejs/plugin-vue';
import dotenv from 'dotenv';

// Load base .env first, then environment-specific overrides
dotenv.config({ path: '../../.env' });
// Load .env.production for production builds (overrides base .env)
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '../../.env.production', override: true });
}

export default defineConfig({
  build: {
    emptyOutDir: true,
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
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  worker: {
    format: 'es',
    plugins: [
      environment('all', { prefix: 'CANISTER_' }),
      environment('all', { prefix: 'DFX_' }),
    ],
  },
  plugins: [
    vue(),
    environment('all', { prefix: 'CANISTER_' }),
    environment('all', { prefix: 'DFX_' }),
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
