import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Run `vercel dev` in this directory (port 3000) so /api routes hit the local serverless handler.
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
  optimizeDeps: {
    include: [
      'react-router-dom',
      '@supabase/supabase-js',
      '@supabase/auth-ui-react',
      '@supabase/auth-ui-shared',
      'uuid'
    ]
  },
  
});
