import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    /* Sin proxy. Las llamadas al backend usan axios contra VITE_API_URL
       (o http://localhost:3000 por defecto). El proxy viejo interceptaba
       rutas del SPA como /eventos/:id y rompía el refresh del navegador. */
  },
});
