import { beforeAll, vi } from 'vitest'

// Set up environment variables for testing
beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_for_testing'
  process.env.BETTER_AUTH_SECRET = 'test-secret'
  process.env.BETTER_AUTH_URL = 'http://localhost:3000'
  process.env.RESEND_TOKEN = 'test-resend-token'
  process.env.RESEND_SENDER_EMAIL = 'test@example.com'
  process.env.CALENDLY_TOKEN = 'test-calendly-token'
  process.env.BLOB_READ_WRITE_TOKEN = 'test-blob-token'
  process.env.CRON_SECRET = 'test-cron-secret'
})

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
}
