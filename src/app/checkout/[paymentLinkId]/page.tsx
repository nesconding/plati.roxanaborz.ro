import { notFound } from 'next/navigation'

import '~/client/modules/checkout/checkout-form'

import { CheckoutModule } from '~/client/modules/checkout'
import { getQueryClient, trpc } from '~/client/trpc/server'

interface CheckoutPageProps {
  params: Promise<{ paymentLinkId: string }>
}
export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { paymentLinkId: id } = await params
  const queryClient = getQueryClient()

  const paymentLink = await queryClient.ensureQueryData(
    trpc.public.paymentLinks.findOneById.queryOptions({ id })
  )
  if (!paymentLink) notFound()

  return <CheckoutModule paymentLink={paymentLink} />
}
