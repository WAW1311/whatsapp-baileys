import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// Root repo (satu tingkat di atas ui/) — sumber tunggal .env, dipakai bareng backend Express.
const rootDir = resolve(import.meta.dirname, '..')

export default defineConfig(({ mode }) => {
  // Baca .env dari root. Hanya var ber-prefix VITE_ yang di-expose ke browser;
  // rahasia backend (JWT_SECRET, MYSQL_*) tetap privat karena tanpa prefix VITE_.
  const env = loadEnv(mode, rootDir, '')
  const target = env.VITE_API_BASE_URL || 'http://localhost:8000'

  return {
    envDir: rootDir,
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': { target, changeOrigin: true },
        '/health': { target, changeOrigin: true },
        '/assets': { target, changeOrigin: true },
        '/socket.io': { target, changeOrigin: true, ws: true },
      },
    },
  }
})
