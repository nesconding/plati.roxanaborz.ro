'use client'

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
import { Separator } from '~/client/components/ui/separator'
import type { OrderDetails } from '~/server/trpc/router/protected/bank-transfers/procedures/get-order-details'

interface OrderSummaryCardProps {
  orderDetails: OrderDetails
}

export function OrderSummaryCard({ orderDetails }: OrderSummaryCardProps) {
  const t = useTranslations('modules.(app).update-bank-transfer.orderSummary')

  const formatCurrency = (amountInCents: number) => {
    return PricingService.formatPrice(
      amountInCents / 100,
      orderDetails.paymentLink.currency
    )
  }

  const getPaymentLinkTypeLabel = (type: string) => {
    switch (type) {
      case 'integral':
        return t('paymentTypes.integral')
      case 'deposit':
        return t('paymentTypes.deposit')
      case 'installments':
        return t('paymentTypes.installments')
      case 'installmentsDeposit':
        return t('paymentTypes.installmentsDeposit')
      default:
        return type
    }
  }

  const getMembershipStatusLabel = (status: string) => {
    return t(`membership.statuses.${status}`)
  }

  const getSubscriptionStatusLabel = (status: string) => {
    return t(`subscription.statuses.${status}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Customer Info */}
        <div className='space-y-2'>
          <h4 className='font-medium text-sm'>{t('customer.title')}</h4>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <span className='text-muted-foreground'>{t('customer.name')}</span>
            <span>{orderDetails.customerName || '-'}</span>
            <span className='text-muted-foreground'>{t('customer.email')}</span>
            <span>{orderDetails.customerEmail}</span>
          </div>
        </div>

        <Separator />

        {/* Product Info */}
        <div className='space-y-2'>
          <h4 className='font-medium text-sm'>{t('product.title')}</h4>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <span className='text-muted-foreground'>{t('product.name')}</span>
            <span>{orderDetails.productName}</span>
            <span className='text-muted-foreground'>{t('product.type')}</span>
            <Badge variant='outline'>
              {orderDetails.orderType === 'product' ? 'Produs' : 'Prelungire'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Payment Info */}
        <div className='space-y-2'>
          <h4 className='font-medium text-sm'>{t('payment.title')}</h4>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <span className='text-muted-foreground'>
              {t('payment.linkType')}
            </span>
            <Badge variant='secondary'>
              {getPaymentLinkTypeLabel(orderDetails.paymentLink.type)}
            </Badge>
            <span className='text-muted-foreground'>
              {t('payment.totalAmount')}
            </span>
            <span className='font-semibold'>
              {formatCurrency(orderDetails.paymentLink.priceAmountInCents)}
            </span>
            {orderDetails.paymentLink.depositAmountInCents && (
              <>
                <span className='text-muted-foreground'>
                  {t('payment.depositAmount')}
                </span>
                <span>
                  {formatCurrency(
                    orderDetails.paymentLink.depositAmountInCents
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Membership Info */}
        {orderDetails.membership && (
          <>
            <Separator />
            <div className='space-y-2'>
              <h4 className='font-medium text-sm'>{t('membership.title')}</h4>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <span className='text-muted-foreground'>
                  {t('membership.status')}
                </span>
                <Badge variant='outline'>
                  {getMembershipStatusLabel(orderDetails.membership.status)}
                </Badge>
                <span className='text-muted-foreground'>
                  {t('membership.startDate')}
                </span>
                <span>
                  {new Date(
                    orderDetails.membership.startDate
                  ).toLocaleDateString('ro-RO')}
                </span>
                <span className='text-muted-foreground'>
                  {t('membership.endDate')}
                </span>
                <span>
                  {new Date(orderDetails.membership.endDate).toLocaleDateString(
                    'ro-RO'
                  )}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Subscription Info */}
        {orderDetails.subscription && (
          <>
            <Separator />
            <div className='space-y-2'>
              <h4 className='font-medium text-sm'>{t('subscription.title')}</h4>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <span className='text-muted-foreground'>
                  {t('subscription.status')}
                </span>
                <Badge variant='outline'>
                  {getSubscriptionStatusLabel(orderDetails.subscription.status)}
                </Badge>
                <span className='text-muted-foreground'>
                  {t('subscription.remainingPayments')}
                </span>
                <span>{orderDetails.subscription.remainingPayments}</span>
                {orderDetails.subscription.nextPaymentDate && (
                  <>
                    <span className='text-muted-foreground'>
                      {t('subscription.nextPaymentDate')}
                    </span>
                    <span>
                      {new Date(
                        orderDetails.subscription.nextPaymentDate
                      ).toLocaleDateString('ro-RO')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
