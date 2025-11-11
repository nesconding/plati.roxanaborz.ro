import type { first_payment_date_after_deposit_options } from '~/server/database/schema/business/models/first-payment-date-after-deposit-options'

const DEPOSIT_FIRST_PAYMENT_DATE_OPTIONS = [
  { value: 2 },
  { value: 10 },
  { value: 14 },
  { value: 15 },
  { value: 30 }
]

export async function createFirstPaymentDateAfterDepositOptionsData(): Promise<
  (typeof first_payment_date_after_deposit_options.$inferInsert)[]
> {
  const data: (typeof first_payment_date_after_deposit_options.$inferInsert)[] =
    DEPOSIT_FIRST_PAYMENT_DATE_OPTIONS
  return data
}
