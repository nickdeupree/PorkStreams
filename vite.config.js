import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist'
  },
  server: {
    proxy: {
      '/api/daddy': {
        target: 'https://daddylivestream.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/daddy/, '/schedule'),
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add headers to mimic browser request
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
            proxyReq.setHeader('Referer', 'https://daddylivestream.com/');
          });
        }
      },
      '/api/pptv': {
        target: 'https://ppv.to',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pptv/, '/api'),
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
            proxyReq.setHeader('Referer', 'https://ppv.to/');
          });
        }
      },
      '/api/shark': {
        target: 'https://sharkstreams.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/shark/, ''),
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
            proxyReq.setHeader('Referer', 'https://sharkstreams.net/');
          });
        }
      },
      '/api/streamed': {
        target: 'https://streamed.pk',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/streamed/, '/api'),
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
            proxyReq.setHeader('Referer', 'https://streamed.pk/');
          });
        }
      }
    }
  }
})
