export enum PaymentStatusType {
  Created = 'created',
  RequiresPaymentMethod = 'requires_payment_method',
  RequiresConfirmation = 'requires_confirmation',
  RequiresAction = 'requires_action',
  Processing = 'processing',
  RequiresCapture = 'requires_capture',
  Canceled = 'canceled',
  Succeeded = 'succeeded',
  PaymentFailed = 'payment_failed',
  Expired = 'expired'
}
