import type { payments_settings } from '~/server/database/schema'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'

type PaymentSettings = typeof payments_settings.$inferSelect

/**
 * Test fixture data for payment settings
 */

export const mockPaymentSettings: PaymentSettings = {
  id: 'settings_123',
  currency: PaymentCurrencyType.RON,
  extraTaxRate: '19.00',
  label: 'Default Settings',
  tvaRate: '19.00',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const createMockPaymentSettings = (
  overrides?: Partial<PaymentSettings>
): PaymentSettings => ({
  ...mockPaymentSettings,
  ...overrides
})
