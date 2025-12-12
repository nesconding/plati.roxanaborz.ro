import { notFound } from 'next/navigation'

import { ThemeSelect } from '~/client/components/theme-select'
import { UpdatePaymentModule } from '~/client/modules/update-payment'
import { getQueryClient, trpc } from '~/client/trpc/server'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

interface UpdatePaymentPageProps {
  params: Promise<{ subscriptionId: string }>
  searchParams: Promise<{ token?: string; type?: string }>
}

export default async function UpdatePaymentPage({
  params,
  searchParams
}: UpdatePaymentPageProps) {
  const { subscriptionId } = await params
  const { token, type: typeParam } = await searchParams

  if (!token) notFound()

  // Default to Product type if not specified
  const type =
    typeParam === PaymentProductType.Extension
      ? PaymentProductType.Extension
      : PaymentProductType.Product

  const queryClient = getQueryClient()

  try {
    const subscriptionData = await queryClient.ensureQueryData(
      trpc.public.subscriptions.validateUpdateToken.queryOptions({
        subscriptionId,
        token,
        type
      })
    )

    if (!subscriptionData) notFound()

    return (
      <div className='h-screen w-screen pt-17'>
        <div className='fixed inset-x-0 top-0 grid w-full grid-cols-[1fr_auto_1fr] p-4'>
          <ThemeSelect className='col-start-3 justify-self-end' />
        </div>

        <UpdatePaymentModule
          subscriptionData={subscriptionData}
          subscriptionId={subscriptionId}
          token={token}
          type={type}
        />
      </div>
    )
  } catch {
    notFound()
  }
}
