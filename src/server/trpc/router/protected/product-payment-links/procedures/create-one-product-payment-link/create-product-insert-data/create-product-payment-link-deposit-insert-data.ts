import { PricingService } from '~/lib/pricing'
import { DatesService } from '~/server/services/dates'
import type { ScheduledEvent } from '~/server/services/scheduledEvents'
import type { CreateProductPaymentLinkDepositFormData } from '~/shared/create-product-payment-link-form/data'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import type {
  FirstPaymentDateAfterDepositOptionsTableValidators,
  PaymentsSettingsTableValidators,
  ProductsTableValidators,
  UsersTableValidators
} from '~/shared/validation/tables'

export type ProductPaymentLinkDepositInsertData = {
  callerName: string
  contractId: string
  createdById: string
  currency: PaymentCurrencyType
  customerEmail: string
  customerName: string
  depositAmount: string
  depositAmountInCents: string
  eurToRonRate: string
  expiresAt: string
  extraTaxRate: string
  firstPaymentDateAfterDeposit: string
  paymentMethodType: PaymentMethodType
  paymentProductType: PaymentProductType.Product
  productId: string
  productName: string
  remainingAmountToPay: string
  remainingAmountToPayInCents: string
  setterName: string
  status: PaymentStatusType
  totalAmountToPay: string
  totalAmountToPayInCents: string
  tvaRate: string
  type: PaymentLinkType.Deposit
}

export function createProductPaymentLinkDepositInsertData({
  data,
  eurToRonRate,
  expiresAt,
  firstPaymentDateAfterDepositOption,
  scheduledEvent,
  product,
  setting,
  user
}: {
  data: CreateProductPaymentLinkDepositFormData
  eurToRonRate: string
  expiresAt: Date
  firstPaymentDateAfterDepositOption: typeof FirstPaymentDateAfterDepositOptionsTableValidators.$types.select
  scheduledEvent: ScheduledEvent
  product: typeof ProductsTableValidators.$types.select
  setting: typeof PaymentsSettingsTableValidators.$types.select
  user: typeof UsersTableValidators.$types.select
}): ProductPaymentLinkDepositInsertData {
  const firstPaymentDateAfterDeposit = DatesService.addDays(
    new Date(),
    firstPaymentDateAfterDepositOption.value
  )

  const price =
    setting.currency === PaymentCurrencyType.EUR
      ? product.price
      : PricingService.convertEURtoRON(product.price, eurToRonRate)

  const { remainingAmountToPay, totalAmountToPay } =
    PricingService.calculateDepositRemainingAmountToPay({
      depositAmount: data.depositAmount,
      extraTaxRate: setting.extraTaxRate,
      price: price,
      tvaRate: setting.tvaRate
    })
  const depositAmountInCents = PricingService.convertToCents(data.depositAmount)
  const remainingAmountToPayInCents =
    PricingService.convertToCents(remainingAmountToPay)
  const totalAmountToPayInCents =
    PricingService.convertToCents(totalAmountToPay)
  return {
    callerName: data.callerName,
    contractId: data.contractId,
    createdById: user.id,
    currency: setting.currency,
    customerEmail: scheduledEvent.participant_emails,
    customerName: scheduledEvent.participant_names,
    depositAmount: data.depositAmount,
    depositAmountInCents: depositAmountInCents.toString(),
    eurToRonRate: eurToRonRate,
    expiresAt: expiresAt.toISOString(),
    extraTaxRate: setting.extraTaxRate,
    firstPaymentDateAfterDeposit: firstPaymentDateAfterDeposit.toISOString(),
    paymentMethodType: data.paymentMethodType,
    paymentProductType: PaymentProductType.Product,
    productId: data.productId,
    productName: product.name,
    remainingAmountToPay: remainingAmountToPay.toString(),
    remainingAmountToPayInCents: remainingAmountToPayInCents.toString(),
    setterName: data.setterName,
    status: PaymentStatusType.Created,
    totalAmountToPay: totalAmountToPay.toString(),
    totalAmountToPayInCents: totalAmountToPayInCents.toString(),
    tvaRate: setting.tvaRate,
    type: PaymentLinkType.Deposit
  }
}
