import { DatesService } from '~/server/services/dates'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PricingService } from './pricing'

export interface PaymentScheduleItem {
  amount: string
  date: string | null
  description: string
  isPaid: boolean
}

export interface PaymentLinkScheduleData {
  currency: 'EUR' | 'RON'
  depositAmount: string | null
  firstPaymentDateAfterDeposit: string | null
  productInstallmentAmountToPay: string | null
  productInstallmentsCount: number | null
  remainingAmountToPay: string | null
  remainingInstallmentAmountToPay: string | null
  totalAmountToPay: string
  type: PaymentLinkType | `${PaymentLinkType}`
}

/**
 * Formats a date in Romanian locale (e.g., "15 Ian 2025")
 */
function formatDateRomanian(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Calculate the payment schedule based on payment link type
 *
 * @param paymentLink - Payment link data with pricing information
 * @returns Array of payment schedule items
 */
export function calculatePaymentSchedule(
  paymentLink: PaymentLinkScheduleData
): PaymentScheduleItem[] {
  const { currency, type } = paymentLink

  switch (type) {
    case PaymentLinkType.Integral:
      return calculateIntegralSchedule(paymentLink, currency)

    case PaymentLinkType.Deposit:
      return calculateDepositSchedule(paymentLink, currency)

    case PaymentLinkType.Installments:
      return calculateInstallmentsSchedule(paymentLink, currency)

    case PaymentLinkType.InstallmentsDeposit:
      return calculateInstallmentsDepositSchedule(paymentLink, currency)

    default:
      return calculateIntegralSchedule(paymentLink, currency)
  }
}

/**
 * Integral: Single full payment
 */
function calculateIntegralSchedule(
  paymentLink: PaymentLinkScheduleData,
  currency: 'EUR' | 'RON'
): PaymentScheduleItem[] {
  return [
    {
      amount: PricingService.formatPrice(
        paymentLink.totalAmountToPay,
        currency
      ),
      date: null,
      description: 'Plată integrală',
      isPaid: false
    }
  ]
}

/**
 * Deposit: Deposit now + remaining later
 */
function calculateDepositSchedule(
  paymentLink: PaymentLinkScheduleData,
  currency: 'EUR' | 'RON'
): PaymentScheduleItem[] {
  const schedule: PaymentScheduleItem[] = [
    {
      amount: PricingService.formatPrice(
        paymentLink.depositAmount ?? '0',
        currency
      ),
      date: null,
      description: 'Avans',
      isPaid: false
    }
  ]

  if (
    paymentLink.remainingAmountToPay &&
    paymentLink.firstPaymentDateAfterDeposit
  ) {
    schedule.push({
      amount: PricingService.formatPrice(
        paymentLink.remainingAmountToPay,
        currency
      ),
      date: formatDateRomanian(paymentLink.firstPaymentDateAfterDeposit),
      description: 'Rest de plată',
      isPaid: false
    })
  }

  return schedule
}

/**
 * Installments: First installment now + remaining monthly
 */
function calculateInstallmentsSchedule(
  paymentLink: PaymentLinkScheduleData,
  currency: 'EUR' | 'RON'
): PaymentScheduleItem[] {
  const schedule: PaymentScheduleItem[] = []
  const installmentsCount = paymentLink.productInstallmentsCount ?? 1
  const installmentAmount = paymentLink.productInstallmentAmountToPay ?? '0'

  for (let i = 0; i < installmentsCount; i++) {
    const isFirst = i === 0
    const date = isFirst
      ? null
      : DatesService.addMonths(new Date(), i).toISOString()

    schedule.push({
      amount: PricingService.formatPrice(installmentAmount, currency),
      date: isFirst ? null : formatDateRomanian(date!),
      description: isFirst ? 'Rata 1' : `Rata ${i + 1}`,
      isPaid: false
    })
  }

  return schedule
}

/**
 * InstallmentsDeposit: Deposit now + installments starting at firstPaymentDateAfterDeposit
 */
function calculateInstallmentsDepositSchedule(
  paymentLink: PaymentLinkScheduleData,
  currency: 'EUR' | 'RON'
): PaymentScheduleItem[] {
  const schedule: PaymentScheduleItem[] = []

  // First item: Deposit
  schedule.push({
    amount: PricingService.formatPrice(
      paymentLink.depositAmount ?? '0',
      currency
    ),
    date: null,
    description: 'Avans',
    isPaid: false
  })

  // Remaining installments
  const installmentsCount = paymentLink.productInstallmentsCount ?? 1
  const installmentAmount = paymentLink.remainingInstallmentAmountToPay ?? '0'
  const firstPaymentDate = paymentLink.firstPaymentDateAfterDeposit

  if (firstPaymentDate) {
    for (let i = 0; i < installmentsCount; i++) {
      const date = DatesService.addMonths(new Date(firstPaymentDate), i)

      schedule.push({
        amount: PricingService.formatPrice(installmentAmount, currency),
        date: formatDateRomanian(date.toISOString()),
        description: `Rata ${i + 1}`,
        isPaid: false
      })
    }
  }

  return schedule
}
