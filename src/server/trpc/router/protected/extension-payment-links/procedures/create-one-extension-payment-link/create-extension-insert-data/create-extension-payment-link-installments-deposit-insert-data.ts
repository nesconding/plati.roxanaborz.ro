import { PricingService } from '~/lib/pricing'
import { DatesService } from '~/server/services/dates'
import type { CreateExtensionPaymentLinkInstallmentsDataDepositFormData } from '~/shared/create-extension-payment-link-form/data'
import type { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import type {
  FirstPaymentDateAfterDepositOptionsTableValidators,
  PaymentsSettingsTableValidators,
  ProductsExtensionsInstallmentsTableValidators,
  UsersTableValidators
} from '~/shared/validation/tables'

export type ExtensionPaymentLinkInstallmentsDepositInsertData = {
  createdById: string
  currency: PaymentCurrencyType
  customerEmail: string
  customerName: string | null
  depositAmount: string
  depositAmountInCents: string
  eurToRonRate: string
  expiresAt: string
  extensionId: string
  extensionInstallmentId: string
  extensionInstallmentsCount: number
  extensionInstallmentAmountToPay: string
  extensionInstallmentAmountToPayInCents: string
  extraTaxRate: string
  firstPaymentDateAfterDeposit: string
  membershipId: string
  paymentMethodType: PaymentMethodType
  paymentProductType: PaymentProductType.Extension
  productName: string
  remainingAmountToPay: string
  remainingAmountToPayInCents: string
  remainingInstallmentAmountToPay: string
  remainingInstallmentAmountToPayInCents: string
  status: PaymentStatusType
  totalAmountToPay: string
  totalAmountToPayInCents: string
  tvaRate: string
  type: PaymentLinkType.InstallmentsDeposit
}

export function createExtensionPaymentLinkInstallmentsDepositInsertData({
  data,
  customerEmail,
  customerName,
  eurToRonRate,
  expiresAt,
  firstPaymentDateAfterDepositOption,
  extensionInstallment,
  setting,
  user,
  productName
}: {
  data: CreateExtensionPaymentLinkInstallmentsDataDepositFormData
  customerEmail: string
  customerName: string | null
  eurToRonRate: string
  expiresAt: Date
  firstPaymentDateAfterDepositOption: typeof FirstPaymentDateAfterDepositOptionsTableValidators.$types.select
  extensionInstallment: typeof ProductsExtensionsInstallmentsTableValidators.$types.select
  setting: typeof PaymentsSettingsTableValidators.$types.select
  user: typeof UsersTableValidators.$types.select
  productName: string
}): ExtensionPaymentLinkInstallmentsDepositInsertData {
  const firstPaymentDateAfterDeposit = DatesService.addDays(
    expiresAt,
    firstPaymentDateAfterDepositOption.value
  )

  const depositAmountInCents = PricingService.convertToCents(data.depositAmount)

  const {
    remainingAmountToPay,
    totalAmountToPay,
    remainingInstallmentAmountToPay,
    installmentAmountToPay
  } = PricingService.calculateInstallmentsDepositRemainingAmountToPay({
    depositAmount: data.depositAmount,
    extraTaxRate: setting.extraTaxRate,
    installmentsCount: extensionInstallment.count,
    pricePerInstallment: extensionInstallment.pricePerInstallment,
    tvaRate: setting.tvaRate
  })
  const installmentAmountToPayInCents = PricingService.convertToCents(
    installmentAmountToPay
  )
  const remainingAmountToPayInCents =
    PricingService.convertToCents(remainingAmountToPay)
  const totalAmountToPayInCents =
    PricingService.convertToCents(totalAmountToPay)
  const remainingInstallmentAmountToPayInCents = PricingService.convertToCents(
    remainingInstallmentAmountToPay
  )

  return {
    createdById: user.id,
    currency: setting.currency,
    customerEmail: customerEmail,
    customerName: customerName,
    depositAmount: data.depositAmount,
    depositAmountInCents: depositAmountInCents.toString(),
    eurToRonRate: eurToRonRate,
    expiresAt: expiresAt.toISOString(),
    extensionId: data.extensionId,
    extensionInstallmentAmountToPay: installmentAmountToPay.toString(),
    extensionInstallmentAmountToPayInCents:
      installmentAmountToPayInCents.toString(),
    extensionInstallmentId: extensionInstallment.id,
    extensionInstallmentsCount: extensionInstallment.count,
    extraTaxRate: setting.extraTaxRate,
    firstPaymentDateAfterDeposit: firstPaymentDateAfterDeposit.toISOString(),
    membershipId: data.membershipId,
    paymentMethodType: data.paymentMethodType,
    paymentProductType: PaymentProductType.Extension,
    productName: productName,
    remainingAmountToPay: remainingAmountToPay.toString(),
    remainingAmountToPayInCents: remainingAmountToPayInCents.toString(),
    remainingInstallmentAmountToPay: remainingInstallmentAmountToPay.toString(),
    remainingInstallmentAmountToPayInCents:
      remainingInstallmentAmountToPayInCents.toString(),
    status: PaymentStatusType.Created,
    totalAmountToPay: totalAmountToPay.toString(),
    totalAmountToPayInCents: totalAmountToPayInCents.toString(),
    tvaRate: setting.tvaRate,
    type: PaymentLinkType.InstallmentsDeposit
  }
}
