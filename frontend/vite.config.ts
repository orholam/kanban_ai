import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
  }
});
