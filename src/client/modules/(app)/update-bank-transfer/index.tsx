'use client'

import { useQuery } from '@tanstack/react-query'
import { Banknote } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '~/client/components/ui/button'
import { Spinner } from '~/client/components/ui/spinner'
import { useTRPC } from '~/client/trpc/react'
import { ConfirmPaymentDialog } from './_components/confirm-payment-dialog'
import { OrderSelectorCombobox } from './_components/order-selector-combobox'
import { OrderSummaryCard } from './_components/order-summary-card'
import { PaymentPlanDisplay } from './_components/payment-plan-display'

export function UpdateBankTransferPageModule() {
  const t = useTranslations('modules.(app).update-bank-transfer')
  const trpc = useTRPC()

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedOrderType, setSelectedOrderType] = useState<
    'product' | 'extension' | null
  >(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  const { data: orderDetails, isLoading: isLoadingDetails } = useQuery({
    ...trpc.protected.bankTransfers.getOrderDetails.queryOptions({
      orderId: selectedOrderId ?? '',
      orderType: selectedOrderType ?? 'product'
    }),
    enabled: !!selectedOrderId && !!selectedOrderType
  })

  const handleSelectOrder = (
    orderId: string,
    orderType: 'product' | 'extension'
  ) => {
    setSelectedOrderId(orderId)
    setSelectedOrderType(orderType)
  }

  const handleConfirmSuccess = () => {
    setSelectedOrderId(null)
    setSelectedOrderType(null)
  }

  return (
    <div className='container mx-auto  space-y-6 p-6'>
      {/* Page Header */}
      <div className='space-y-2'>
        <h1 className='font-bold text-2xl tracking-tight'>{t('title')}</h1>
        <p className='text-muted-foreground'>{t('subtitle')}</p>
      </div>

      {/* Order Selector */}
      <div className='space-y-2'>
        <label className='font-medium text-sm'>
          {t('orderSelector.label')}
        </label>
        <OrderSelectorCombobox
          disabled={isLoadingDetails}
          onSelect={handleSelectOrder}
          selectedOrderId={selectedOrderId}
        />
      </div>

      {/* Loading State */}
      {isLoadingDetails && (
        <div className='flex items-center justify-center py-12'>
          <Spinner />
        </div>
      )}

      {/* Order Details */}
      {orderDetails && !isLoadingDetails && (
        <div className='grid gap-6 lg:grid-cols-2'>
          <OrderSummaryCard orderDetails={orderDetails} />
          <PaymentPlanDisplay orderDetails={orderDetails} />
        </div>
      )}

      {/* Confirm Button */}
      {orderDetails && !isLoadingDetails && (
        <div className='flex justify-end'>
          <Button onClick={() => setIsConfirmDialogOpen(true)} size='lg'>
            <Banknote />
            {t('confirmButton')}
          </Button>
        </div>
      )}

      {/* Confirm Dialog */}
      {selectedOrderId && selectedOrderType && (
        <ConfirmPaymentDialog
          isOpen={isConfirmDialogOpen}
          onCloseDialog={() => setIsConfirmDialogOpen(false)}
          onSuccess={handleConfirmSuccess}
          orderId={selectedOrderId}
          orderType={selectedOrderType}
        />
      )}
    </div>
  )
}
