import { business } from '~/server/database/schema/schemas'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'

export const payment_currency_type = business.enum('payment_currency_type', [
  PaymentCurrencyType.RON,
  PaymentCurrencyType.EUR
])
