import { PricingService } from '~/lib/pricing'
import type { ScheduledEvent } from '~/server/services/scheduledEvents'
import type { CreateProductPaymentLinkInstallmentsFormData } from '~/shared/create-product-payment-link-form/data'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import type {
  PaymentsSettingsTableValidators,
  ProductsInstallmentsTableValidators,
  ProductsTableValidators,
  UsersTableValidators
} from '~/shared/validation/tables'

export type ProductPaymentLinkInstallmentsInsertData = {
  callerName: string
  contractId: string
  createdById: string
  currency: PaymentCurrencyType
  customerEmail: string
  customerName: string
  eurToRonRate: string
  expiresAt: string
  extraTaxRate: string
  productInstallmentAmountToPay: string
  productInstallmentAmountToPayInCents: string
  productInstallmentId: string
  productInstallmentsCount: number
  paymentMethodType: PaymentMethodType
  paymentProductType: PaymentProductType.Product
  productId: string
  productName: string
  setterName: string
  status: PaymentStatusType
  totalAmountToPay: string
  totalAmountToPayInCents: string
  tvaRate: string
  type: PaymentLinkType.Installments
}

export function createProductPaymentLinkInstallmentsInsertData({
  data,
  eurToRonRate,
  baseProductInstallment,
  expiresAt,
  scheduledEvent,
  product,
  setting,
  user
}: {
  data: CreateProductPaymentLinkInstallmentsFormData
  eurToRonRate: string
  baseProductInstallment: typeof ProductsInstallmentsTableValidators.$types.select
  expiresAt: Date
  scheduledEvent: ScheduledEvent
  product: typeof ProductsTableValidators.$types.select
  setting: typeof PaymentsSettingsTableValidators.$types.select
  user: typeof UsersTableValidators.$types.select
}): ProductPaymentLinkInstallmentsInsertData {
  const pricePerInstallment =
    setting.currency === PaymentCurrencyType.EUR
      ? baseProductInstallment.pricePerInstallment
      : PricingService.convertEURtoRON(
          baseProductInstallment.pricePerInstallment,
          eurToRonRate
        )
  const { installmentAmountToPay, totalAmountToPay } =
    PricingService.calculateInstallmentsAmountToPay({
      extraTaxRate: setting.extraTaxRate,
      installmentsCount: baseProductInstallment.count,
      pricePerInstallment: pricePerInstallment,
      tvaRate: setting.tvaRate
    })
  const installmentAmountToPayInCents = PricingService.convertToCents(
    installmentAmountToPay
  )
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
    productInstallmentAmountToPay: installmentAmountToPay.toString(),
    productInstallmentAmountToPayInCents:
      installmentAmountToPayInCents.toString(),
    productInstallmentId: baseProductInstallment.id,
    productInstallmentsCount: baseProductInstallment.count,
    productName: product.name,
    setterName: data.setterName,
    status: PaymentStatusType.Created,
    totalAmountToPay: totalAmountToPay.toString(),
    totalAmountToPayInCents: totalAmountToPayInCents.toString(),
    tvaRate: setting.tvaRate,
    type: PaymentLinkType.Installments
  }
}
