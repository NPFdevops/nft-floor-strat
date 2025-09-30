import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // Increase limit to 1000kb (default is 500kb)
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React libraries into separate chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Split chart and visualization libraries
          charts: ['lightweight-charts', 'html2canvas'],
          // Split utility and service libraries
          utils: ['axios', 'date-fns', 'posthog-js']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api/strategies': {
        target: 'https://www.nftstrategy.fun',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/strategies/, '/api/strategies')
      },
      '/api/holdings': {
        target: 'https://www.nftstrategy.fun',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/holdings/, '/api/holdings')
      }
    }
  }
})
