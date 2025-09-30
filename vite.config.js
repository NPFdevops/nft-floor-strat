import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/strategies': {
        target: 'https://www.nftstrategy.fun',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/strategies/, '/api/strategies')
      }
    }
  }
})
