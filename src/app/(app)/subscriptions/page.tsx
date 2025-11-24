import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { SubscriptionsPageModule } from '~/client/modules/(app)/subscriptions'

import { getQueryClient, trpc } from '~/client/trpc/server'

interface SubscriptionsPageProps {
  searchParams: Promise<{
    search: string
  }>
}

export default async function SubscriptionsPage({
  searchParams
}: SubscriptionsPageProps) {
  const { search } = await searchParams
  const queryClient = getQueryClient()

  await Promise.all([
    queryClient.ensureQueryData(
      trpc.protected.extensionsSubscriptions.findAll.queryOptions()
    ),
    queryClient.ensureQueryData(
      trpc.protected.productSubscriptions.findAll.queryOptions()
    )
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SubscriptionsPageModule search={search} />
    </HydrationBoundary>
  )
}
