import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { OrdersPageModule } from '~/client/modules/(app)/orders'
import { getQueryClient, trpc } from '~/client/trpc/server'

export default async function SubscriptionsPage() {
  const queryClient = getQueryClient()

  await Promise.all([
    queryClient.ensureQueryData(
      trpc.protected.extensionOrders.findAll.queryOptions()
    ),
    queryClient.ensureQueryData(
      trpc.protected.productOrders.findAll.queryOptions()
    )
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrdersPageModule />
    </HydrationBoundary>
  )
}
