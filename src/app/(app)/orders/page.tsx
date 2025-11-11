import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { OrdersPageModule } from '~/client/modules/(app)/orders'
import { getQueryClient, trpc } from '~/client/trpc/server'

export default async function SubscriptionsPage() {
  const queryClient = getQueryClient()

  await queryClient.ensureQueryData(
    trpc.protected.orders.findAll.queryOptions()
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrdersPageModule />
    </HydrationBoundary>
  )
}
