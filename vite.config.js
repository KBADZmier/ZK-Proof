import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    exclude: [
      '@noir-lang/backend_barretenberg',
      '@noir-lang/noir_js',
      '@aztec/bb.js'
    ]
  },

  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  },

  build: {
    target: 'esnext'
  }
})
 