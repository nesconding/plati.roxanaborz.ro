import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { SubscriptionsPageModule } from '~/client/modules/(app)/subscriptions'

import { getQueryClient, trpc } from '~/client/trpc/server'

export default async function SubscriptionsPage() {
  const queryClient = getQueryClient()

  await queryClient.ensureQueryData(
    trpc.protected.subscriptions.findAll.queryOptions()
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SubscriptionsPageModule />
    </HydrationBoundary>
  )
}
