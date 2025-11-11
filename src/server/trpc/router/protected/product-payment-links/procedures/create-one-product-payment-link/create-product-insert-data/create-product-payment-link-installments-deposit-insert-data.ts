import { PricingService } from '~/lib/pricing'
import { DatesService } from '~/server/services/dates'
import type { Meeting } from '~/server/services/meetings'
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
  contractId: string
  createdById: string
  currency: PaymentCurrencyType
  customerEmail: string
  customerName: string
  depositAmount: string
  depositAmountInCents: string
  eurToRonRate: string
  expiresAt: string
  extraTaxRate: number
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

export function createProductPaymentLinkInstallmentsDepositInsertData({
  data,
  eurToRonRate,
  baseProductInstallment,
  expiresAt,
  firstPaymentDateAfterDepositOption,
  meeting,
  product,
  setting,
  user
}: {
  data: CreateProductPaymentLinkInstallmentsDepositFormData
  eurToRonRate: string
  baseProductInstallment: typeof ProductsInstallmentsTableValidators.$types.select
  expiresAt: Date
  firstPaymentDateAfterDepositOption: typeof FirstPaymentDateAfterDepositOptionsTableValidators.$types.select
  meeting: Meeting
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
    callerName: data.callerName,
    contractId: data.contractId,
    createdById: user.id,
    currency: setting.currency,
    customerEmail: meeting.participant_emails,
    customerName: meeting.participant_names,
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
    setterName: data.setterName,
    status: PaymentStatusType.Created,
    totalAmountToPay: totalAmountToPay.toString(),
    totalAmountToPayInCents: totalAmountToPayInCents.toString(),
    tvaRate: setting.tvaRate,
    type: PaymentLinkType.InstallmentsDeposit
  }
}
