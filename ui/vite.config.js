import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://203.194.113.161:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://203.194.113.161:8000',
        changeOrigin: true,
      },
      '/assets': {
        target: 'http://203.194.113.161:8000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://203.194.113.161:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
