import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // IMPORTANT: Must match Django's STATIC_URL ('/static/') so that the built
  // index.html references /static/assets/... which WhiteNoise actually serves.
  // Without this, the browser gets 404s on all JS/CSS → white screen.
  base: '/static/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // When running in Docker, set `VITE_BACKEND_URL=http://backend:8000`.
    // Keep `changeOrigin: false` so Django builds absolute media/static URLs using the browser's host,
    // and Vite can proxy those paths back to the backend.
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
      '/admin': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
      '/static': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
      '/media': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
})
