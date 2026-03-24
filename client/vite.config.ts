import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), 'VITE_');

  const apiBase = (env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});