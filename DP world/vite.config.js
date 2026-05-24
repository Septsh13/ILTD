import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': { 
        target: 'http://127.0.0.1:3001', 
        changeOrigin: true,
        secure: false,
      },
      '/cha': { 
        target: 'http://127.0.0.1:3001', 
        changeOrigin: true,
        secure: false,
      },
      '/govt': { 
        target: 'http://127.0.0.1:3001', 
        changeOrigin: true,
        secure: false,
      },
      '/cbi': { 
        target: 'http://127.0.0.1:3001', 
        changeOrigin: true,
        secure: false,
      },
      '/complaints': { 
        target: 'http://127.0.0.1:3001', 
        changeOrigin: true,
        secure: false,
      },
      '/admin': { 
        target: 'http://127.0.0.1:3001', 
        changeOrigin: true,
        secure: false,
      },
      '/health': { 
        target: 'http://127.0.0.1:3001', 
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
