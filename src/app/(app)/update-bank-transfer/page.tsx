import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { UpdateBankTransferPageModule } from '~/client/modules/(app)/update-bank-transfer'
import { getQueryClient, trpc } from '~/client/trpc/server'

export default async function UpdateBankTransferPage() {
  const queryClient = getQueryClient()

  await queryClient.ensureQueryData(
    trpc.protected.bankTransfers.findPendingOrders.queryOptions()
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UpdateBankTransferPageModule />
    </HydrationBoundary>
  )
}
