import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { PaymentLinksPageModule } from '~/client/modules/(app)/payment-links'
import { getQueryClient, trpc } from '~/client/trpc/server'

interface PaymentLinksPageProps {
  searchParams: Promise<{
    search: string
  }>
}

export default async function PaymentLinksPage({
  searchParams
}: PaymentLinksPageProps) {
  const { search } = await searchParams

  const queryClient = getQueryClient()
  await queryClient.ensureQueryData(
    trpc.protected.productPaymentLinks.findAll.queryOptions()
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PaymentLinksPageModule search={search} />
    </HydrationBoundary>
  )
}
