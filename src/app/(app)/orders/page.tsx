import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { OrdersPageModule } from '~/client/modules/(app)/orders'
import { getQueryClient, trpc } from '~/client/trpc/server'

interface OrdersPageProps {
  searchParams: Promise<{
    search: string
  }>
}
export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { search } = await searchParams
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
      <OrdersPageModule search={search} />
    </HydrationBoundary>
  )
}
