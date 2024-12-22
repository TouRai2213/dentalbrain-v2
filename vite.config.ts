import path from 'path'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174
  },
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      REACT_APP_BACKEND_V2: JSON.stringify(process.env.REACT_APP_BACKEND_V2),
      REACT_APP_BACKEND_V1: JSON.stringify(process.env.REACT_APP_BACKEND_V1)
    }
  }
});
