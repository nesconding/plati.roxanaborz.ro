import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'src/client/**', // Only testing server-side payment logic
        'src/app/**', // Excluding Next.js app routes from unit tests
        'src/emails/**',
        'src/server/database/drizzle/**', // Generated migrations
        'src/server/database/seed/**' // Seed scripts
      ]
    },
    include: ['src/**/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.next']
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      '#test': path.resolve(__dirname, './test')
    }
  }
})
