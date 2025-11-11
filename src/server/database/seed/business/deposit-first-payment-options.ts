import type { firstPaymentDateAfterDepositOptions } from '~/server/database/schema/business/models/first-payment-date-after-deposit-options'

const DEPOSIT_FIRST_PAYMENT_DATE_OPTIONS = [
  { value: 2 },
  { value: 10 },
  { value: 14 },
  { value: 15 },
  { value: 30 }
]

export async function createFirstPaymentDateAfterDepositOptionsData(): Promise<
  (typeof firstPaymentDateAfterDepositOptions.$inferInsert)[]
> {
  const data: (typeof firstPaymentDateAfterDepositOptions.$inferInsert)[] =
    DEPOSIT_FIRST_PAYMENT_DATE_OPTIONS
  return data
}
