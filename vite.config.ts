import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    proxy: {
      '^/api/.*': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['framer-motion', 'react-router-dom', 'lucide-react'],
          utils: ['axios', 'react-toastify', 'uuid', 'geolib'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector']
        }
      }
    }
  }
});
