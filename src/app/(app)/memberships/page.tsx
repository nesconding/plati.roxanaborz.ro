import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { MembershipsPageModule } from '~/client/modules/(app)/memberships'
import { getQueryClient, trpc } from '~/client/trpc/server'

export default async function MembershipsPage() {
  const queryClient = getQueryClient()
  await queryClient.ensureQueryData(
    trpc.protected.memberships.findAll.queryOptions()
  )
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MembershipsPageModule />
    </HydrationBoundary>
  )
}
