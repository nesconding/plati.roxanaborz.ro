import { business } from '~/server/database/schema/schemas'
import { PaymentStatusType } from '~/shared/enums/payment-status'

export const payment_status_type = business.enum('payment_status_type', [
  PaymentStatusType.Created,
  PaymentStatusType.RequiresPaymentMethod,
  PaymentStatusType.RequiresConfirmation,
  PaymentStatusType.RequiresAction,
  PaymentStatusType.Processing,
  PaymentStatusType.RequiresCapture,
  PaymentStatusType.Canceled,
  PaymentStatusType.Succeeded,
  PaymentStatusType.PaymentFailed,
  PaymentStatusType.Expired
])
