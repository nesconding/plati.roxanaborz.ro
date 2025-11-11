import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient, trpc } from '~/client/trpc/server'

export default async function PaymentLinksLayout({
  children
}: React.PropsWithChildren) {
  const queryClient = getQueryClient()

  await Promise.all([
    await queryClient.ensureQueryData(
      trpc.protected.products.findAll.queryOptions()
    ),
    await queryClient.ensureQueryData(
      trpc.protected.meetings.findAll.queryOptions()
    ),
    await queryClient.ensureQueryData(
      trpc.protected.settings.findAllPaymentSettings.queryOptions()
    ),
    await queryClient.ensureQueryData(
      trpc.protected.settings.getEURToRONRate.queryOptions()
    ),
    await queryClient.ensureQueryData(
      trpc.protected.settings.findAllFirstPaymentDateAfterDepositOptions.queryOptions()
    )
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}
