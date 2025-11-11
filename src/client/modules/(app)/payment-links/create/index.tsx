import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { CreateProductPaymentLinkForm } from '~/client/modules/(app)/payment-links/create/create-product-payment-link-form'
import { getQueryClient, trpc } from '~/client/trpc/server'

export async function ProductPaymentLinksCreatePageModule() {
  const queryClient = getQueryClient()

  await Promise.all([
    queryClient.ensureQueryData(trpc.protected.products.findAll.queryOptions()),
    queryClient.ensureQueryData(
      trpc.protected.settings.getEURToRONRate.queryOptions()
    ),
    queryClient.ensureQueryData(
      trpc.protected.settings.findAllFirstPaymentDateAfterDepositOptions.queryOptions()
    ),
    queryClient.ensureQueryData(
      trpc.protected.settings.findAllPaymentSettings.queryOptions()
    ),
    queryClient.ensureQueryData(
      trpc.protected.settings.findAllPaymentSettings.queryOptions()
    ),
    queryClient.ensureQueryData(trpc.protected.meetings.findAll.queryOptions())
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CreateProductPaymentLinkForm />
    </HydrationBoundary>
  )
}
