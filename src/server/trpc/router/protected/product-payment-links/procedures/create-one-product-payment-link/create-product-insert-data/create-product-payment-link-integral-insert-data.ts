import { PricingService } from '~/lib/pricing'
import type { ScheduledEvent } from '~/server/services/scheduledEvents'
import type { CreateProductPaymentLinkIntegralFormData } from '~/shared/create-product-payment-link-form/data'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import type {
  PaymentsSettingsTableValidators,
  ProductsTableValidators,
  UsersTableValidators
} from '~/shared/validation/tables'

export type ProductPaymentLinkIntegralInsertData = {
  callerName: string
  contractId: string
  createdById: string
  currency: PaymentCurrencyType
  customerEmail: string
  customerName: string
  eurToRonRate: string
  expiresAt: string
  extraTaxRate: string
  paymentMethodType: PaymentMethodType
  paymentProductType: PaymentProductType.Product
  productId: string
  productName: string
  setterName: string
  status: PaymentStatusType
  totalAmountToPay: string
  totalAmountToPayInCents: string
  tvaRate: string
  type: PaymentLinkType.Integral
}

export function createProductPaymentLinkIntegralInsertData({
  data,
  eurToRonRate,
  expiresAt,
  scheduledEvent,
  product,
  setting,
  user
}: {
  data: CreateProductPaymentLinkIntegralFormData
  eurToRonRate: string
  expiresAt: Date
  scheduledEvent: ScheduledEvent
  product: typeof ProductsTableValidators.$types.select
  setting: typeof PaymentsSettingsTableValidators.$types.select
  user: typeof UsersTableValidators.$types.select
}): ProductPaymentLinkIntegralInsertData {
  const price =
    setting.currency === PaymentCurrencyType.EUR
      ? product.price
      : PricingService.convertEURtoRON(product.price, eurToRonRate)

  const totalAmountToPay = PricingService.calculateTotalAmountToPay({
    extraTaxRate: setting.extraTaxRate,
    price: price,
    tvaRate: setting.tvaRate
  })
  const totalAmountToPayInCents =
    PricingService.convertToCents(totalAmountToPay)
  return {
    callerName: data.callerName,
    contractId: data.contractId,
    createdById: user.id,
    currency: setting.currency,
    customerEmail: scheduledEvent.participant_emails,
    customerName: scheduledEvent.participant_names,
    eurToRonRate: eurToRonRate,
    expiresAt: expiresAt.toISOString(),
    extraTaxRate: setting.extraTaxRate,
    paymentMethodType: data.paymentMethodType,
    paymentProductType: PaymentProductType.Product,
    productId: data.productId,
    productName: product.name,
    setterName: data.setterName,
    status: PaymentStatusType.Created,
    totalAmountToPay: totalAmountToPay.toString(),
    totalAmountToPayInCents: totalAmountToPayInCents.toString(),
    tvaRate: setting.tvaRate,
    type: PaymentLinkType.Integral
  }
}
