'use client'

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useMutation } from '@tanstack/react-query'
import { CreditCard, Lock, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Button } from '~/client/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/client/components/ui/card'
import { ElementsWrapper } from '~/client/modules/checkout/elements'
import { useTRPC } from '~/client/trpc/react'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

interface UpdatePaymentModuleProps {
  subscriptionData: {
    customerEmail: string
    customerName: string | null
    id: string
    productName: string
  }
  subscriptionId: string
  token: string
  type: PaymentProductType
}

export function UpdatePaymentModule({
  subscriptionData,
  subscriptionId,
  token,
  type
}: UpdatePaymentModuleProps) {
  const trpc = useTRPC()
  const t = useTranslations('modules.update-payment')

  const createSetupIntent = useMutation(
    trpc.public.subscriptions.createSetupIntent.mutationOptions()
  )

  // Create SetupIntent on mount
  useEffect(() => {
    if (
      !createSetupIntent.data &&
      !createSetupIntent.isPending &&
      !createSetupIntent.isError
    ) {
      createSetupIntent.mutate({ subscriptionId, token, type })
    }
  }, [subscriptionId, token, type, createSetupIntent])

  if (createSetupIntent.isError) {
    return (
      <div className='flex h-[calc(100vh-theme(spacing.16)-theme(spacing.1))] w-full items-center justify-center p-6'>
        <Card className='w-full md:max-w-md'>
          <CardContent className='pt-6'>
            <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive'>
              {createSetupIntent.error?.message || t('errorGeneric')}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (createSetupIntent.isPending || !createSetupIntent.data) {
    return (
      <div className='flex h-[calc(100vh-theme(spacing.16)-theme(spacing.1))] w-full items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary' />
          <p className='text-muted-foreground text-sm'>{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <ElementsWrapper clientSecret={createSetupIntent.data.clientSecret}>
      <UpdatePaymentForm
        subscriptionData={subscriptionData}
        subscriptionId={subscriptionId}
        token={token}
        type={type}
      />
    </ElementsWrapper>
  )
}

interface UpdatePaymentFormProps {
  subscriptionData: {
    customerEmail: string
    customerName: string | null
    id: string
    productName: string
  }
  subscriptionId: string
  token: string
  type: PaymentProductType
}

function UpdatePaymentForm({
  subscriptionData,
  subscriptionId,
  token,
  type
}: UpdatePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const t = useTranslations('modules.update-payment')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)
    setError(null)

    try {
      await elements.submit()

      const { error: stripeError } = await stripe.confirmSetup({
        confirmParams: {
          return_url: `${window.location.origin}/update-payment/${subscriptionId}/callback?token=${token}&type=${type}`
        },
        elements
      })

      if (stripeError) {
        setError(stripeError.message ?? t('errorGeneric'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorGeneric'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='flex h-[calc(100vh-theme(spacing.16)-theme(spacing.1))] w-full items-center justify-center p-6'>
      <Card className='w-full md:max-w-lg'>
        <CardHeader className='space-y-4'>
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10'>
            <CreditCard className='h-7 w-7 text-primary' />
          </div>
          <div className='text-center'>
            <CardTitle className='text-xl'>{t('title')}</CardTitle>
            <CardDescription className='mt-2'>
              {t('description')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Subscription Info */}
          <div className='rounded-lg border bg-muted/30 p-4 space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>{t('product')}</span>
              <span className='font-medium'>{subscriptionData.productName}</span>
            </div>
            {subscriptionData.customerName && (
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>{t('customer')}</span>
                <span className='font-medium'>
                  {subscriptionData.customerName}
                </span>
              </div>
            )}
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>{t('email')}</span>
              <span className='font-medium'>{subscriptionData.customerEmail}</span>
            </div>
          </div>

          {/* Payment Form */}
          <form id='update-payment-form' onSubmit={handleSubmit}>
            <div className='space-y-4'>
              <PaymentElement
                options={{
                  layout: 'tabs',
                  terms: { card: 'never' }
                }}
              />

              {error && (
                <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive'>
                  {error}
                </div>
              )}
            </div>
          </form>

          {/* Security Badge */}
          <div className='flex items-center justify-center gap-2 text-xs text-muted-foreground'>
            <Lock className='h-3 w-3' />
            <span>{t('securityNote')}</span>
          </div>
        </CardContent>

        <CardFooter className='flex flex-col gap-3'>
          <Button
            className='w-full'
            disabled={isSubmitting || !stripe || !elements}
            form='update-payment-form'
            size='lg'
            type='submit'
          >
            {isSubmitting ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent' />
                {t('submitting')}
              </>
            ) : (
              <>
                <ShieldCheck className='mr-2 h-4 w-4' />
                {t('submit')}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
