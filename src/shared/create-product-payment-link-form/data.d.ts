import type { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { PaymentMethodType } from '~/shared/enums/payment-method-type'

export type CreateProductPaymentLinkIntegralFormData = {
  callerName: string
  contractId: string
  scheduledEventUri: string
  paymentMethodType: PaymentMethodType
  paymentSettingId: string
  productId: string
  setterName: string
  type: PaymentLinkType.Integral
}

export type CreateProductPaymentLinkDepositFormData = {
  callerName: string
  contractId: string
  depositAmount: string
  firstPaymentDateAfterDepositOptionId: string
  hasDeposit: true
  scheduledEventUri: string
  paymentMethodType: PaymentMethodType
  paymentSettingId: string
  productId: string
  setterName: string
  type: PaymentLinkType.Deposit
}

export type CreateProductPaymentLinkInstallmentsFormData = {
  callerName: string
  contractId: string
  hasInstallments: true
  productInstallmentId: string
  scheduledEventUri: string
  paymentMethodType: PaymentMethodType
  paymentSettingId: string
  productId: string
  setterName: string
  type: PaymentLinkType.Installments
}

export type CreateProductPaymentLinkInstallmentsDepositFormData = {
  callerName: string
  contractId: string
  depositAmount: string
  firstPaymentDateAfterDepositOptionId: string
  hasDeposit: true
  hasInstallments: true
  productInstallmentId: string
  scheduledEventUri: string
  paymentMethodType: PaymentMethodType
  paymentSettingId: string
  productId: string
  setterName: string
  type: PaymentLinkType.InstallmentsDeposit
}

export type CreateProductPaymentLinkFormData =
  | CreateProductPaymentLinkIntegralFormData
  | CreateProductPaymentLinkDepositFormData
  | CreateProductPaymentLinkInstallmentsFormData
  | CreateProductPaymentLinkInstallmentsDepositFormData
