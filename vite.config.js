import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'node:fs'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/pc-arbitrator-system/',
  plugins: [
    vue(),
    {
      name: 'gh-pages-404-fallback',
      closeBundle() {
        const distIndex = path.resolve(__dirname, 'dist/index.html')
        if (fs.existsSync(distIndex)) {
          fs.copyFileSync(distIndex, path.resolve(__dirname, 'dist/404.html'))
        }
      },
    },
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
