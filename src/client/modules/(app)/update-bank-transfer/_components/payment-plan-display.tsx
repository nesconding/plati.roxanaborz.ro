'use client'

import { Check, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '~/client/components/ui/badge'
import { PricingService } from '~/lib/pricing'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'
import { cn } from '~/client/lib/utils'
import type { OrderDetails } from '~/server/trpc/router/protected/bank-transfers/procedures/get-order-details'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'

interface PaymentPlanDisplayProps {
  orderDetails: OrderDetails
}

interface PaymentRow {
  amount: number
  date: string | null
  isCurrentPayment: boolean
  isPaid: boolean
  label: string
}

export function PaymentPlanDisplay({ orderDetails }: PaymentPlanDisplayProps) {
  const t = useTranslations('modules.(app).update-bank-transfer.paymentPlan')

  const formatCurrency = (amountInCents: number) => {
    return PricingService.formatPrice(
      amountInCents / 100,
      orderDetails.paymentLink.currency
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ro-RO')
  }

  const addMonths = (dateString: string, months: number): string => {
    const date = new Date(dateString)
    date.setMonth(date.getMonth() + months)
    return date.toISOString()
  }

  const getPaymentRows = (): PaymentRow[] => {
    const { paymentLink, subscription } = orderDetails
    const totalAmount = paymentLink.priceAmountInCents
    const depositAmount = paymentLink.depositAmountInCents ?? 0
    const installmentsCount =
      paymentLink.productInstallmentsCount ??
      paymentLink.extensionInstallmentsCount ??
      1

    const rows: PaymentRow[] = []

    switch (paymentLink.type) {
      case PaymentLinkType.Integral:
        // Single payment
        rows.push({
          amount: totalAmount,
          date: null,
          isCurrentPayment: true,
          isPaid: false,
          label: t('rows.fullPayment')
        })
        break

      case PaymentLinkType.Deposit: {
        // Deposit + remaining payment
        const depositPaid = !!subscription
        const remainingPaymentPaid = subscription?.remainingPayments === 0

        rows.push({
          amount: depositAmount,
          date: null,
          isCurrentPayment: !depositPaid,
          isPaid: depositPaid,
          label: t('rows.deposit')
        })
        rows.push({
          amount: totalAmount - depositAmount,
          date: paymentLink.firstPaymentDateAfterDeposit,
          isCurrentPayment: depositPaid && !remainingPaymentPaid,
          isPaid: remainingPaymentPaid,
          label: t('rows.remainingPayment')
        })
        break
      }

      case PaymentLinkType.Installments: {
        // N installments
        const installmentAmount = Math.round(totalAmount / installmentsCount)
        const paidInstallments =
          installmentsCount -
          (subscription?.remainingPayments ?? installmentsCount)
        const baseDate = new Date().toISOString()

        let foundCurrent = false
        for (let i = 0; i < installmentsCount; i++) {
          const isPaid = i < paidInstallments
          const isCurrentPayment = !isPaid && !foundCurrent
          if (isCurrentPayment) foundCurrent = true
          // First installment is immediate (no date), subsequent ones are monthly
          const installmentDate = i === 0 ? null : addMonths(baseDate, i)
          rows.push({
            amount: installmentAmount,
            date: installmentDate,
            isCurrentPayment,
            isPaid,
            label: t('rows.installment', { number: i + 1 })
          })
        }
        break
      }

      case PaymentLinkType.InstallmentsDeposit: {
        // Deposit + N installments
        const remainingAmount = totalAmount - depositAmount
        const installmentAmount = Math.round(
          remainingAmount / installmentsCount
        )
        const depositPaid = !!subscription
        const paidInstallments =
          installmentsCount -
          (subscription?.remainingPayments ?? installmentsCount)
        const firstInstallmentDate = paymentLink.firstPaymentDateAfterDeposit

        rows.push({
          amount: depositAmount,
          date: null,
          isCurrentPayment: !depositPaid,
          isPaid: depositPaid,
          label: t('rows.deposit')
        })

        let foundCurrent = false
        for (let i = 0; i < installmentsCount; i++) {
          const isPaid = i < paidInstallments
          const isCurrentPayment = depositPaid && !isPaid && !foundCurrent
          if (isCurrentPayment) foundCurrent = true
          // First installment uses firstPaymentDateAfterDeposit, subsequent ones add months
          const installmentDate =
            firstInstallmentDate && i > 0
              ? addMonths(firstInstallmentDate, i)
              : firstInstallmentDate
          rows.push({
            amount: installmentAmount,
            date: installmentDate,
            isCurrentPayment,
            isPaid,
            label: t('rows.installment', { number: i + 1 })
          })
        }
        break
      }

      default:
        rows.push({
          amount: totalAmount,
          date: null,
          isCurrentPayment: true,
          isPaid: false,
          label: t('rows.fullPayment')
        })
    }

    return rows
  }

  const paymentRows = getPaymentRows()

  // Calculate the expected payment amount (next unpaid row)
  const nextPayment = paymentRows.find((row) => !row.isPaid)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Payment Schedule */}
        <div className='space-y-2'>
          {paymentRows.map((row, index) => (
            <div
              className={cn(
                'flex items-center justify-between rounded-lg border p-3',
                row.isPaid && 'bg-muted/50 opacity-60',
                row.isCurrentPayment &&
                  'border-primary bg-primary/5 ring-1 ring-primary'
              )}
              // biome-ignore lint/suspicious/noArrayIndexKey: <asd>
              key={index}
            >
              <div className='flex items-center gap-3'>
                {row.isPaid ? (
                  <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary'>
                    <Check className='h-4 w-4 text-primary-foreground' />
                  </div>
                ) : (
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full',
                      row.isCurrentPayment && 'bg-primary'
                    )}
                  >
                    <Clock
                      className={cn(
                        'h-3 w-3 text-muted-foreground',
                        row.isCurrentPayment && 'text-primary-foreground'
                      )}
                    />
                  </div>
                )}
                <div className='flex flex-col'>
                  <div className='flex items-center gap-2'>
                    <span
                      className={cn(
                        'font-medium text-sm',
                        row.isPaid && 'line-through'
                      )}
                    >
                      {row.label}
                    </span>
                  </div>
                  {row.date && (
                    <span className='text-muted-foreground text-xs'>
                      {t('rows.dueDate', { date: formatDate(row.date) })}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  'font-semibold',
                  row.isPaid && 'line-through',
                  row.isCurrentPayment && 'text-primary'
                )}
              >
                {formatCurrency(row.amount)}
              </span>
            </div>
          ))}
        </div>

        {/* Expected Payment Amount */}
        {nextPayment && (
          <div className='rounded-lg bg-primary/10 p-4'>
            <div className='flex items-center justify-between'>
              <span className='font-medium text-sm'>
                {t('expectedPayment')}
              </span>
              <span className='font-bold text-lg text-primary'>
                {formatCurrency(nextPayment.amount)}
              </span>
            </div>
            {nextPayment.date && (
              <div className='mt-1 flex items-center justify-between'>
                <span className='text-muted-foreground text-xs'>
                  {t('dueDate')}
                </span>
                <Badge variant='outline'>{formatDate(nextPayment.date)}</Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
