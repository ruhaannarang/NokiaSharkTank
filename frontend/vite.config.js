import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Build stamp: visible in the footer. If the footer stamp doesn't change
  // after pulling new code + restarting, you're looking at a stale tab/bundle.
  define: {
    __BUILD_ID__: JSON.stringify(new Date().toISOString())
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/health': 'http://localhost:8000'
    }
  }
})
