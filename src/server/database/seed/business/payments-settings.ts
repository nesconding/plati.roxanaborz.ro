import type { payments_settings } from '~/server/database/schema'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'

const PAYMENTS_SETTINGS = [
  {
    currency: PaymentCurrencyType.EUR,
    extraTaxRate: '0',
    label: 'Olanda',
    tvaRate: '21'
  },
  {
    currency: PaymentCurrencyType.RON,
    extraTaxRate: '21',
    label: 'Republica Moldova',
    tvaRate: '0'
  },
  {
    currency: PaymentCurrencyType.RON,
    extraTaxRate: '0',
    isDefault: true,
    label: 'România',
    tvaRate: '21'
  },
  {
    currency: PaymentCurrencyType.EUR,
    extraTaxRate: '0',
    label: 'Cipru',
    tvaRate: '0'
  }
]

export async function createPaymentsSettingsData(): Promise<
  (typeof payments_settings.$inferInsert)[]
> {
  const data: (typeof payments_settings.$inferInsert)[] = PAYMENTS_SETTINGS
  return data
}
