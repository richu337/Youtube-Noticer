import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/youtube-rss': {
        target: 'https://www.youtube.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/youtube-rss/, '/feeds/videos.xml'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
