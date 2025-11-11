import { PricingService } from '~/lib/pricing'
import type { CreateExtensionPaymentLinkInstallmentsFormData } from '~/shared/create-extension-payment-link-form/data'
import type { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import type {
  PaymentsSettingsTableValidators,
  ProductsExtensionsInstallmentsTableValidators,
  UsersTableValidators
} from '~/shared/validation/tables'

export type ExtensionPaymentLinkInstallmentsInsertData = {
  createdById: string
  currency: PaymentCurrencyType
  customerEmail: string
  customerName: string
  eurToRonRate: string
  expiresAt: string
  extensionId: string
  extensionInstallmentId: string
  extensionInstallmentsCount: number
  extensionInstallmentAmountToPay: string
  extensionInstallmentAmountToPayInCents: string
  extraTaxRate: string
  membershipId: string
  paymentMethodType: PaymentMethodType
  paymentProductType: PaymentProductType.Extension
  productName: string
  status: PaymentStatusType
  totalAmountToPay: string
  totalAmountToPayInCents: string
  tvaRate: string
  type: PaymentLinkType.Installments
}

export function createExtensionPaymentLinkInstallmentsInsertData({
  data,
  customerEmail,
  customerName,
  eurToRonRate,
  expiresAt,
  extensionInstallment,
  setting,
  user,
  productName
}: {
  data: CreateExtensionPaymentLinkInstallmentsFormData
  customerEmail: string
  customerName: string
  eurToRonRate: string
  expiresAt: Date
  extensionInstallment: typeof ProductsExtensionsInstallmentsTableValidators.$types.select
  setting: typeof PaymentsSettingsTableValidators.$types.select
  user: typeof UsersTableValidators.$types.select
  productName: string
}): ExtensionPaymentLinkInstallmentsInsertData {
  const { installmentAmountToPay, totalAmountToPay } =
    PricingService.calculateInstallmentsAmountToPay({
      extraTaxRate: setting.extraTaxRate,
      installmentsCount: extensionInstallment.count,
      pricePerInstallment: extensionInstallment.pricePerInstallment,
      tvaRate: setting.tvaRate
    })
  const installmentAmountToPayInCents = PricingService.convertToCents(
    installmentAmountToPay
  )
  const totalAmountToPayInCents =
    PricingService.convertToCents(totalAmountToPay)

  return {
    createdById: user.id,
    currency: setting.currency,
    customerEmail: customerEmail,
    customerName: customerName,
    eurToRonRate: eurToRonRate,
    expiresAt: expiresAt.toISOString(),
    extensionId: data.extensionId,
    extensionInstallmentAmountToPay: installmentAmountToPay.toString(),
    extensionInstallmentAmountToPayInCents:
      installmentAmountToPayInCents.toString(),
    extensionInstallmentId: data.extensionInstallmentId,
    extensionInstallmentsCount: extensionInstallment.count,
    extraTaxRate: setting.extraTaxRate,
    membershipId: data.membershipId,
    paymentMethodType: data.paymentMethodType,
    paymentProductType: PaymentProductType.Extension,
    productName: productName,
    status: PaymentStatusType.Created,
    totalAmountToPay: totalAmountToPay.toString(),
    totalAmountToPayInCents: totalAmountToPayInCents.toString(),
    tvaRate: setting.tvaRate,
    type: PaymentLinkType.Installments
  }
}
