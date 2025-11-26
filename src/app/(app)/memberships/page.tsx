import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { MembershipsPageModule } from '~/client/modules/(app)/memberships'
import { getQueryClient, trpc } from '~/client/trpc/server'

interface MembershipsPageProps {
  searchParams: Promise<{
    search?: string
  }>
}
export default async function MembershipsPage({
  searchParams
}: MembershipsPageProps) {
  const { search } = await searchParams
  const queryClient = getQueryClient()
  await queryClient.ensureQueryData(
    trpc.protected.memberships.findAll.queryOptions()
  )
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MembershipsPageModule search={search} />
    </HydrationBoundary>
  )
}
