import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'src/public',
  server: {
    port: 5173,
    proxy: {
      // Proxear /api al backend en desarrollo — sin CORS issues
      '/api': {
        target:    'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
