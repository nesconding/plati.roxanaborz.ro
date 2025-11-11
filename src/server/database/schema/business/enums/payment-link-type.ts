import { business } from '~/server/database/schema/schemas'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'

export const payment_link_type = business.enum('payment_link_type', [
  PaymentLinkType.Integral,
  PaymentLinkType.Deposit,
  PaymentLinkType.Installments,
  PaymentLinkType.InstallmentsDeposit
])
