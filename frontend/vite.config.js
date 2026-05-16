import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth'         : 'http://localhost:3000',
      '/eventos'      : 'http://localhost:3000',
      '/usuarios'     : 'http://localhost:3000',
      '/api'          : 'http://localhost:3000',
      '/qr'           : 'http://localhost:3000',
      '/gamificacion' : 'http://localhost:3000',
      '/notificaciones': 'http://localhost:3000',
    },
  },
});
