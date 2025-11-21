import type { TRPCRouterOutput } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'
import { DatesService } from '~/server/services/dates'
import type { CreateProductPaymentLinkInstallmentsDepositFormData } from '~/shared/create-product-payment-link-form/data'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import type {
  FirstPaymentDateAfterDepositOptionsTableValidators,
  PaymentsSettingsTableValidators,
  ProductsInstallmentsTableValidators,
  ProductsTableValidators,
  UsersTableValidators
} from '~/shared/validation/tables'

export type ProductPaymentLinkInstallmentsDepositInsertData = {
  callerName: string
  callerEmail: string
  closerEmail: string
  closerName: string
  setterEmail: string
  contractId: string
  createdById: string
  currency: PaymentCurrencyType
  customerEmail: string
  customerName: string | null
  depositAmount: string
  depositAmountInCents: string
  eurToRonRate: string
  expiresAt: string
  extraTaxRate: string
  firstPaymentDateAfterDeposit: string
  productInstallmentAmountToPay: string
  productInstallmentAmountToPayInCents: string
  productInstallmentId: string
  productInstallmentsCount: number
  paymentMethodType: PaymentMethodType
  paymentProductType: PaymentProductType.Product
  productId: string
  productName: string
  remainingAmountToPay: string
  remainingAmountToPayInCents: string
  remainingInstallmentAmountToPay: string
  remainingInstallmentAmountToPayInCents: string
  setterName: string
  status: PaymentStatusType
  totalAmountToPay: string
  totalAmountToPayInCents: string
  tvaRate: string
  type: PaymentLinkType.InstallmentsDeposit
}

type ScheduledEvent =
  TRPCRouterOutput['protected']['scheduledEvents']['findAll'][number]
export function createProductPaymentLinkInstallmentsDepositInsertData({
  data,
  eurToRonRate,
  baseProductInstallment,
  expiresAt,
  firstPaymentDateAfterDepositOption,
  scheduledEvent,
  product,
  setting,
  user
}: {
  data: CreateProductPaymentLinkInstallmentsDepositFormData
  eurToRonRate: string
  baseProductInstallment: typeof ProductsInstallmentsTableValidators.$types.select
  expiresAt: Date
  firstPaymentDateAfterDepositOption: typeof FirstPaymentDateAfterDepositOptionsTableValidators.$types.select
  scheduledEvent: ScheduledEvent
  product: typeof ProductsTableValidators.$types.select
  setting: typeof PaymentsSettingsTableValidators.$types.select
  user: typeof UsersTableValidators.$types.select
}): ProductPaymentLinkInstallmentsDepositInsertData {
  const firstPaymentDateAfterDeposit = DatesService.addDays(
    new Date(),
    firstPaymentDateAfterDepositOption.value
  )

  const pricePerInstallment =
    setting.currency === PaymentCurrencyType.EUR
      ? baseProductInstallment.pricePerInstallment
      : PricingService.convertEURtoRON(
          baseProductInstallment.pricePerInstallment,
          eurToRonRate
        )

  const {
    remainingAmountToPay,
    totalAmountToPay,
    remainingInstallmentAmountToPay,
    installmentAmountToPay
  } = PricingService.calculateInstallmentsDepositRemainingAmountToPay({
    depositAmount: data.depositAmount,
    extraTaxRate: setting.extraTaxRate,
    installmentsCount: baseProductInstallment.count,
    pricePerInstallment: pricePerInstallment,
    tvaRate: setting.tvaRate
  })
  const depositAmountInCents = PricingService.convertToCents(data.depositAmount)
  const remainingAmountToPayInCents =
    PricingService.convertToCents(remainingAmountToPay)
  const remainingInstallmentAmountToPayInCents = PricingService.convertToCents(
    remainingInstallmentAmountToPay
  )
  const installmentAmountToPayInCents = PricingService.convertToCents(
    installmentAmountToPay
  )
  const totalAmountToPayInCents =
    PricingService.convertToCents(totalAmountToPay)
  return {
    callerEmail: data.callerEmail,
    callerName: data.callerName,
    closerEmail: scheduledEvent.closerEmail,
    closerName: scheduledEvent.closerName,
    contractId: data.contractId,
    createdById: user.id,
    currency: setting.currency,
    customerEmail: scheduledEvent.inviteeEmail,
    customerName: scheduledEvent.inviteeName,
    depositAmount: data.depositAmount,
    depositAmountInCents: depositAmountInCents.toString(),
    eurToRonRate: eurToRonRate,
    expiresAt: expiresAt.toISOString(),
    extraTaxRate: setting.extraTaxRate,
    firstPaymentDateAfterDeposit: firstPaymentDateAfterDeposit.toISOString(),
    paymentMethodType: data.paymentMethodType,
    paymentProductType: PaymentProductType.Product,
    productId: data.productId,
    productInstallmentAmountToPay: installmentAmountToPay.toString(),
    productInstallmentAmountToPayInCents:
      installmentAmountToPayInCents.toString(),
    productInstallmentId: baseProductInstallment.id,
    productInstallmentsCount: baseProductInstallment.count,
    productName: product.name,
    remainingAmountToPay: remainingAmountToPay.toString(),
    remainingAmountToPayInCents: remainingAmountToPayInCents.toString(),
    remainingInstallmentAmountToPay: remainingInstallmentAmountToPay.toString(),
    remainingInstallmentAmountToPayInCents:
      remainingInstallmentAmountToPayInCents.toString(),
    setterEmail: data.setterEmail,
    setterName: data.setterName,
    status: PaymentStatusType.Created,
    totalAmountToPay: totalAmountToPay.toString(),
    totalAmountToPayInCents: totalAmountToPayInCents.toString(),
    tvaRate: setting.tvaRate,
    type: PaymentLinkType.InstallmentsDeposit
  }
}
