import type { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { PaymentMethodType } from '~/shared/enums/payment-method-type'

export type CreateExtensionPaymentLinkIntegralFormData = {
  callerEmail: string
  callerName: string
  closerEmail: string
  closerName: string
  setterEmail: string
  setterName: string
  extensionId: string
  membershipId: string
  paymentMethodType: PaymentMethodType
  paymentSettingId: string
  type: PaymentLinkType.Integral
}

export type CreateExtensionPaymentLinkDepositFormData = {
  callerEmail: string
  callerName: string
  closerEmail: string
  closerName: string
  setterEmail: string
  setterName: string
  depositAmount: string
  extensionId: string
  firstPaymentDateAfterDepositOptionId: string
  hasDeposit: true
  membershipId: string
  paymentMethodType: PaymentMethodType
  paymentSettingId: string
  type: PaymentLinkType.Deposit
}

export type CreateExtensionPaymentLinkInstallmentsFormData = {
  callerEmail: string
  callerName: string
  closerEmail: string
  closerName: string
  setterEmail: string
  setterName: string
  extensionId: string
  extensionInstallmentId: string
  hasInstallments: true
  membershipId: string
  paymentMethodType: PaymentMethodType
  paymentSettingId: string
  type: PaymentLinkType.Installments
}

export type CreateExtensionPaymentLinkInstallmentsDataDepositFormData = {
  callerEmail: string
  callerName: string
  closerEmail: string
  closerName: string
  setterEmail: string
  setterName: string
  depositAmount: string
  extensionId: string
  extensionInstallmentId: string
  firstPaymentDateAfterDepositOptionId: string
  hasDeposit: true
  hasInstallments: true
  membershipId: string
  paymentMethodType: PaymentMethodType
  paymentSettingId: string
  type: PaymentLinkType.InstallmentsDeposit
}

export type CreateExtensionPaymentLinkFormData =
  | CreateExtensionPaymentLinkIntegralFormData
  | CreateExtensionPaymentLinkDepositFormData
  | CreateExtensionPaymentLinkInstallmentsFormData
  | CreateExtensionPaymentLinkInstallmentsDataDepositFormData
