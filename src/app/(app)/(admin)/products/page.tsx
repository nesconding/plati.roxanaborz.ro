import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { ProductsPageModule } from '~/client/modules/(app)/(admin)/products'
import { getQueryClient, trpc } from '~/client/trpc/server'

export default async function ProductsPage() {
  const queryClient = getQueryClient()
  await queryClient.ensureQueryData(
    trpc.protected.products.findAll.queryOptions()
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsPageModule />
    </HydrationBoundary>
  )
}
