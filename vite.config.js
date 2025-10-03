import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Production optimizations
  build: {
    target: 'es2020', // Modern browser support
    minify: 'terser', // Better minification than esbuild
    chunkSizeWarningLimit: 1000,
    sourcemap: process.env.NODE_ENV === 'development', // Only generate sourcemaps in dev
    
    // Terser options for better compression
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production', // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    
    rollupOptions: {
      output: {
        // Optimized chunking strategy
        manualChunks: {
          // Split React libraries into separate chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Split chart and visualization libraries
          charts: ['lightweight-charts', 'html2canvas'],
          // Split utility and service libraries
          utils: ['axios', 'date-fns', 'posthog-js']
        },
        
        // Optimize chunk and asset names for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.[^/.]+$/, '')
            : 'chunk'
          return `js/[name]-[hash].js`
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          let extType = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images'
          } else if (/woff|woff2/.test(extType)) {
            extType = 'fonts'
          }
          return `${extType}/[name]-[hash].[ext]`
        }
      },
      
      // External dependencies (if using CDN)
      external: process.env.VITE_USE_CDN === 'true' ? [
        'react',
        'react-dom'
      ] : []
    },
    
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    reportCompressedSize: false, // Disable for faster builds
    
    // Enable CSS code splitting
    cssCodeSplit: true
  },
  
  // Development server optimizations
  server: {
    host: true, // Allow external connections
    port: 3000,
    strictPort: false,
    
    // Enable HTTP/2 for development
    https: process.env.HTTPS === 'true',
    
    // Optimize dev server performance
    fs: {
      strict: true,
      allow: ['..'] // Allow serving files from parent directory
    },
    
    proxy: {
      '/api/strategies': {
        target: 'https://www.nftstrategy.fun',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/strategies/, '/api/strategies'),
        configure: (proxy, options) => {
          // Add request/response logging in development
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.host}${proxyReq.path}`)
            }
          })
        }
      },
      '/api/holdings': {
        target: 'https://www.nftstrategy.fun',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/holdings/, '/api/holdings'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.host}${proxyReq.path}`)
            }
          })
        }
      }
    }
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'date-fns',
      'lightweight-charts',
      'posthog-js'
    ],
    exclude: ['better-sqlite3'], // Node.js specific modules
    esbuildOptions: {
      target: 'es2020'
    }
  },
  
  // Environment variable handling
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production'
  },
  
  // CSS preprocessing
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `$env: ${process.env.NODE_ENV};`
      }
    },
    postcss: {
      plugins: [
        // Will be loaded from postcss.config.js if exists
      ]
    }
  }
})
