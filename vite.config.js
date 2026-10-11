import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const page = (path) => resolve(import.meta.dirname, path);

export default defineConfig({
  appType: 'mpa',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: page('index.html'),
        order: page('order/index.html'),
        admin: page('admin/index.html'),
      },
    },
  },
  server: {
    port: 5180,
    strictPort: true,
  },
});
