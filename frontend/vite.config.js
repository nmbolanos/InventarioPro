import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/compras': {
        target: 'https://capitalist-hilde-darpolc-e92dd24f.koyeb.app/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/compras/, '')
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
