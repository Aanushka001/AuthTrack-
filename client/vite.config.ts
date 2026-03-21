import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env from project root (parent of client/)
  const env = loadEnv(mode, path.resolve(__dirname, '..'), 'VITE_');
  
  const apiUrl = env.VITE_API_URL || 'http://localhost:3001/api';
  const apiBase = apiUrl.replace('/api', '');
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: '0.0.0.0', // Allow LAN access
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    },
    optimizeDeps: {
      exclude: ['lucide-react'] // prevent pre-bundling this dependency
    },
    define: {
      // Vite automatically exposes VITE_ prefixed vars as import.meta.env.*
    }
  };
});
