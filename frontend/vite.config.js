import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api ke backend Java (Spring Boot) agar frontend dan backend
// dapat dijalankan terpisah tanpa konfigurasi CORS tambahan.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
