'use client'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Logo } from '~/client/components/logo'
import { type TRPCRouterOutput, useTRPC } from '~/client/trpc/react'
import { PricingService } from '~/lib/pricing'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'

type PaymentLink = NonNullable<
  TRPCRouterOutput['public']['paymentLinks']['findOneById']
>

function getPaidAmount(paymentLink: PaymentLink) {
  switch (paymentLink.type) {
    case PaymentLinkType.Integral:
      return PricingService.formatPrice(
        paymentLink.totalAmountToPay,
        paymentLink.currency
      )
    case PaymentLinkType.Deposit:
      return PricingService.formatPrice(
        paymentLink.depositAmount ?? 0,
        paymentLink.currency
      )
    case PaymentLinkType.Installments:
      return PricingService.formatPrice(
        paymentLink.productInstallmentAmountToPay ?? 0,
        paymentLink.currency
      )
    case PaymentLinkType.InstallmentsDeposit:
      return PricingService.formatPrice(
        paymentLink.depositAmount ?? 0,
        paymentLink.currency
      )
    default:
      throw new Error('Invalid payment link type')
  }
}

interface CheckoutCallbackPageModuleProps {
  paymentLinkId: string
}

export function CheckoutCallbackPageModule({
  paymentLinkId
}: CheckoutCallbackPageModuleProps) {
  const t = useTranslations('modules.(app).checkout.callback')
  const trpc = useTRPC()
  const findOnePaymentLinkByIdQuery = useQuery(
    trpc.public.paymentLinks.findOneById.queryOptions({
      id: paymentLinkId
    })
  )

  const paymentLink = findOnePaymentLinkByIdQuery.data

  const paidAmount = paymentLink ? getPaidAmount(paymentLink) : 0

  return (
    <div className='grid h-svh w-full grid-rows-[1fr_auto_1fr] grid-cols-1 items-center justify-center gap-7'>
      <Logo className='w-48 justify-self-center place-self-end' />

      <div className='flex flex-col items-center justify-center gap-2'>
        <p className='text-center text-xl font-semibold'>
          {t('title', { paidAmount })}
        </p>
        <p className='text-center'>{t('close')}</p>
      </div>
    </div>
  )
}
