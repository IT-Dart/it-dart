import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Only src/ unit tests — e2e/ holds separate Playwright specs, run via
    // a different tool, not vitest.
    include: ['src/**/*.{test,spec}.js'],
  },
})
