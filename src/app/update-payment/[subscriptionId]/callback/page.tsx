import { ThemeSelect } from '~/client/components/theme-select'
import { UpdatePaymentCallbackModule } from '~/client/modules/update-payment/callback'
import { createTRPCContext } from '~/server/trpc/config'
import { appRouter } from '~/server/trpc/router'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

interface UpdatePaymentCallbackPageProps {
  params: Promise<{ subscriptionId: string }>
  searchParams: Promise<{
    setup_intent?: string
    setup_intent_client_secret?: string
    redirect_status?: string
    token?: string
    type?: string
  }>
}

export default async function UpdatePaymentCallbackPage({
  params,
  searchParams
}: UpdatePaymentCallbackPageProps) {
  const { subscriptionId } = await params
  const {
    setup_intent: setupIntentId,
    redirect_status: redirectStatus,
    token,
    type: typeParam
  } = await searchParams

  let success = false
  let error: string | null = null

  // Default to Product type if not specified
  const type =
    typeParam === PaymentProductType.Extension
      ? PaymentProductType.Extension
      : PaymentProductType.Product

  if (!setupIntentId || !token) {
    error = 'Missing required parameters'
  } else if (redirectStatus !== 'succeeded') {
    error = 'Payment method setup was not successful'
  } else {
    try {
      // Create tRPC caller for server-side mutation
      const ctx = await createTRPCContext({ headers: new Headers() })
      const caller = appRouter.createCaller(ctx)

      await caller.public.subscriptions.updatePaymentMethod({
        setupIntentId,
        subscriptionId,
        token,
        type
      })

      success = true
    } catch (err) {
      error =
        err instanceof Error ? err.message : 'Failed to update payment method'
    }
  }

  return (
    <div className='h-screen w-screen pt-17'>
      <div className='fixed inset-x-0 top-0 grid w-full grid-cols-[1fr_auto_1fr] p-4'>
        <ThemeSelect className='col-start-3 justify-self-end' />
      </div>

      <div className='flex h-[calc(100vh-theme(spacing.16)-theme(spacing.1))] w-full items-center justify-center p-6'>
        <UpdatePaymentCallbackModule success={success} error={error} />
      </div>
    </div>
  )
}
