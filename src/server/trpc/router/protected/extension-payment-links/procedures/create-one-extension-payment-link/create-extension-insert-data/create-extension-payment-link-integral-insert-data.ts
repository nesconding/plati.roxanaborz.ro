import { PricingService } from '~/lib/pricing'
import type { CreateExtensionPaymentLinkIntegralFormData } from '~/shared/create-extension-payment-link-form/data'
import type { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import type {
  PaymentsSettingsTableValidators,
  ProductsExtensionsTableValidators,
  UsersTableValidators
} from '~/shared/validation/tables'

export type ExtensionPaymentLinkIntegralInsertData = {
  createdById: string
  currency: PaymentCurrencyType
  customerEmail: string
  customerName: string
  eurToRonRate: string
  expiresAt: string
  extensionId: string
  extraTaxRate: number
  membershipId: string
  paymentMethodType: PaymentMethodType
  paymentProductType: PaymentProductType.Extension
  productName: string
  status: PaymentStatusType
  totalAmountToPay: string
  totalAmountToPayInCents: string
  tvaRate: string
  type: PaymentLinkType.Integral
}

export function createExtensionPaymentLinkIntegralInsertData({
  data,
  customerEmail,
  customerName,
  eurToRonRate,
  expiresAt,
  extension,
  setting,
  user,
  productName
}: {
  data: CreateExtensionPaymentLinkIntegralFormData
  customerEmail: string
  customerName: string
  eurToRonRate: string
  expiresAt: Date
  extension: typeof ProductsExtensionsTableValidators.$types.select
  setting: typeof PaymentsSettingsTableValidators.$types.select
  user: typeof UsersTableValidators.$types.select
  productName: string
}): ExtensionPaymentLinkIntegralInsertData {
  const totalAmountToPay = PricingService.calculateTotalAmountToPay({
    extraTaxRate: setting.extraTaxRate,
    price: extension.price,
    tvaRate: setting.tvaRate
  })
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
    extraTaxRate: setting.extraTaxRate,
    membershipId: data.membershipId,
    paymentMethodType: data.paymentMethodType,
    paymentProductType: PaymentProductType.Extension,
    productName: productName,
    status: PaymentStatusType.Created,
    totalAmountToPay: totalAmountToPay.toString(),
    totalAmountToPayInCents: totalAmountToPayInCents.toString(),
    tvaRate: setting.tvaRate,
    type: PaymentLinkType.Integral
  }
}
