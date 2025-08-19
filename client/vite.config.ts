import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true // Allow LAN access
  },
  optimizeDeps: {
    exclude: ['lucide-react'] // prevent pre-bundling this dependency
  }
});
