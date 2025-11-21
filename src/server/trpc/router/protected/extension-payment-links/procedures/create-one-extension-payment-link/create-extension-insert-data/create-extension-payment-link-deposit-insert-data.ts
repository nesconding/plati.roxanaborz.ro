import { PricingService } from '~/lib/pricing'
import { DatesService } from '~/server/services/dates'
import type { CreateExtensionPaymentLinkDepositFormData } from '~/shared/create-extension-payment-link-form/data'
import type { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import type {
  FirstPaymentDateAfterDepositOptionsTableValidators,
  PaymentsSettingsTableValidators,
  ProductsExtensionsTableValidators,
  UsersTableValidators
} from '~/shared/validation/tables'

export type ExtensionPaymentLinkDepositInsertData = {
  createdById: string
  customerEmail: string
  customerName: string | null
  depositAmount: string
  depositAmountInCents: string
  currency: PaymentCurrencyType
  eurToRonRate: string
  expiresAt: string
  extensionId: string
  extraTaxRate: string
  firstPaymentDateAfterDeposit: string
  membershipId: string
  paymentMethodType: PaymentMethodType
  paymentProductType: PaymentProductType.Extension
  productName: string
  remainingAmountToPay: string
  remainingAmountToPayInCents: string
  status: PaymentStatusType
  totalAmountToPay: string
  totalAmountToPayInCents: string
  tvaRate: string
  type: PaymentLinkType.Deposit
}

export function createExtensionPaymentLinkDepositInsertData({
  data,
  customerEmail,
  customerName,
  eurToRonRate,
  firstPaymentDateAfterDepositOption,
  expiresAt,
  extension,
  setting,
  user,
  productName
}: {
  data: CreateExtensionPaymentLinkDepositFormData
  customerEmail: string
  customerName: string | null
  eurToRonRate: string
  expiresAt: Date
  firstPaymentDateAfterDepositOption: typeof FirstPaymentDateAfterDepositOptionsTableValidators.$types.select
  extension: typeof ProductsExtensionsTableValidators.$types.select
  setting: typeof PaymentsSettingsTableValidators.$types.select
  user: typeof UsersTableValidators.$types.select
  productName: string
}): ExtensionPaymentLinkDepositInsertData {
  const firstPaymentDateAfterDeposit = DatesService.addDays(
    expiresAt,
    firstPaymentDateAfterDepositOption.value
  )
  const depositAmountInCents = PricingService.convertToCents(data.depositAmount)

  const { remainingAmountToPay, totalAmountToPay } =
    PricingService.calculateDepositRemainingAmountToPay({
      depositAmount: data.depositAmount,
      extraTaxRate: setting.extraTaxRate,
      price: extension.price,
      tvaRate: setting.tvaRate
    })
  const remainingAmountToPayInCents =
    PricingService.convertToCents(remainingAmountToPay)
  const totalAmountToPayInCents =
    PricingService.convertToCents(totalAmountToPay)

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
    extraTaxRate: setting.extraTaxRate,
    firstPaymentDateAfterDeposit: firstPaymentDateAfterDeposit.toISOString(),
    membershipId: data.membershipId,
    paymentMethodType: data.paymentMethodType,
    paymentProductType: PaymentProductType.Extension,
    productName: productName,
    remainingAmountToPay: remainingAmountToPay.toString(),
    remainingAmountToPayInCents: remainingAmountToPayInCents.toString(),
    status: PaymentStatusType.Created,
    totalAmountToPay: totalAmountToPay.toString(),
    totalAmountToPayInCents: totalAmountToPayInCents.toString(),
    tvaRate: setting.tvaRate,
    type: PaymentLinkType.Deposit
  }
}
