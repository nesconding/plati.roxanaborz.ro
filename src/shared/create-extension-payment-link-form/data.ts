import type { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { PaymentMethodType } from '~/shared/enums/payment-method-type'

export type CreateExtensionPaymentLinkIntegralFormData = {
  extensionId: string
  membershipId: string
  paymentMethodType: PaymentMethodType
  paymentSettingId: string
  type: PaymentLinkType.Integral
}

export type CreateExtensionPaymentLinkDepositFormData = {
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
  extensionId: string
  extensionInstallmentId: string
  hasInstallments: true
  membershipId: string
  paymentMethodType: PaymentMethodType
  paymentSettingId: string
  type: PaymentLinkType.Installments
}

export type CreateExtensionPaymentLinkInstallmentsDataDepositFormData = {
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
