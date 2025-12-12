'use client'

import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

import { Logo } from '~/client/components/logo'
import { Spinner } from '~/client/components/ui/spinner'
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
    case PaymentLinkType.Installments: {
      // Handle both product and extension payment links
      const installmentAmount =
        'productInstallmentAmountToPay' in paymentLink
          ? paymentLink.productInstallmentAmountToPay
          : 'extensionInstallmentAmountToPay' in paymentLink
            ? paymentLink.extensionInstallmentAmountToPay
            : null
      return PricingService.formatPrice(
        installmentAmount ?? 0,
        paymentLink.currency
      )
    }
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
  const searchParams = useSearchParams()
  const trpc = useTRPC()

  // Get payment status from Stripe redirect params
  const paymentIntentStatus = searchParams.get('redirect_status')
  const isSuccess = paymentIntentStatus === 'succeeded'
  const isFailed =
    paymentIntentStatus === 'failed' || paymentIntentStatus === 'canceled'
  const isPending = !isSuccess && !isFailed

  const findOnePaymentLinkByIdQuery = useQuery(
    trpc.public.paymentLinks.findOneById.queryOptions({
      id: paymentLinkId
    })
  )

  const paymentLink = findOnePaymentLinkByIdQuery.data
  const paidAmount = paymentLink ? getPaidAmount(paymentLink) : 0

  return (
    <div className='grid h-svh w-full grid-cols-1 grid-rows-[1fr_auto_1fr] items-center justify-center gap-7 p-4'>
      <Logo className='w-48 place-self-end justify-self-center' />

      <div className='flex flex-col items-center justify-center gap-6'>
        {/* Status Icon */}
        <div className='flex items-center justify-center'>
          {isSuccess && (
            <div className='bg-primary/10 rounded-full p-4'>
              <CheckCircle2 className='text-primary size-16' />
            </div>
          )}
          {isFailed && (
            <div className='bg-destructive/10 rounded-full p-4'>
              <XCircle className='text-destructive size-16' />
            </div>
          )}
          {isPending && (
            <div className='bg-muted rounded-full p-4'>
              <Spinner className='size-16' />
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className='flex flex-col items-center gap-2 text-center'>
          {isSuccess && (
            <>
              <h1 className='text-2xl font-bold'>{t('success.title')}</h1>
              <p className='text-muted-foreground'>
                {t('success.description')}
              </p>
            </>
          )}
          {isFailed && (
            <>
              <h1 className='text-destructive text-2xl font-bold'>
                {t('error.title')}
              </h1>
              <p className='text-muted-foreground'>{t('error.description')}</p>
            </>
          )}
          {isPending && (
            <>
              <h1 className='text-2xl font-bold'>{t('pending.title')}</h1>
              <p className='text-muted-foreground'>
                {t('pending.description')}
              </p>
            </>
          )}
        </div>

        {/* Order Summary (only for success) */}
        {isSuccess && paymentLink && (
          <div className='bg-muted/50 w-full max-w-md rounded-lg p-6'>
            <h2 className='mb-4 text-center text-sm font-semibold'>
              {t('summary.title')}
            </h2>
            <div className='divide-y'>
              <div className='flex items-center justify-between py-2'>
                <span className='text-muted-foreground text-sm'>
                  {t('summary.product')}
                </span>
                <span className='text-sm font-medium'>
                  {paymentLink.productName}
                </span>
              </div>
              <div className='flex items-center justify-between py-2'>
                <span className='text-muted-foreground text-sm'>
                  {t('summary.amount')}
                </span>
                <span className='text-primary text-sm font-bold'>
                  {paidAmount}
                </span>
              </div>
              <div className='flex items-center justify-between py-2'>
                <span className='text-muted-foreground text-sm'>
                  {t('summary.method')}
                </span>
                <span className='text-sm font-medium'>
                  {paymentLink.paymentMethodType}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Close Message */}
        <p className='text-muted-foreground text-center text-sm'>
          {t('close')}
        </p>
      </div>

      {/* Footer spacer */}
      <div />
    </div>
  )
}
