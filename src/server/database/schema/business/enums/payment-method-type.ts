import { business } from '~/server/database/schema/schemas'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'

export const payment_method_type = business.enum('payment_method_type', [
  PaymentMethodType.BankTransfer,
  PaymentMethodType.Card,
  PaymentMethodType.TBI
])
