import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/integration/setup.ts',
    include: ['test/integration/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['test/unit/**/*'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'scripts/',
        '.next/'
      ]
    },
    testTimeout: 30000, // Integration tests may take longer
    retry: 2
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/app': path.resolve(__dirname, './src/app')
    }
  },
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.CLAUDE_API_KEY': '"test-key"',
    'process.env.NEXTAUTH_SECRET': '"test-secret"'
  }
})
