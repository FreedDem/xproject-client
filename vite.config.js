import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Конфиг под раздельный деплой (Amvera + отдельный API)
// Во время разработки API доступен по localhost:5174,
// в проде используется VITE_API_BASE (задано в окружении Amvera)
export default defineConfig({
  plugins: [react()],

  server: {
    open: true,
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/uploads': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },

  preview: {
    port: 5173,
    host: true
  },

  // ✅ Собираем стандартно в dist (Amvera будет раздавать через serve)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    assetsInlineLimit: 4096
  }
})
